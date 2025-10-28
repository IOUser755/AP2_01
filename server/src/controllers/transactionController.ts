import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/index.js';
import { CustomError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

const toObjectId = (value?: string) => {
  if (!value) return undefined;
  return new mongoose.Types.ObjectId(value);
};

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.tenant) {
      throw new CustomError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const {
      agentId,
      amount,
      currency,
      paymentProvider,
      paymentMethodId,
      description,
      metadata = {},
      paymentMethodType = 'CARD',
    } = req.body;

    const payerName = req.user.fullName ?? `${req.user.firstName} ${req.user.lastName}`;
    const payeeName = req.tenant.companyName ?? 'Tenant';

    const transaction = await Transaction.create({
      tenantId: req.tenant._id,
      agentId: agentId ? toObjectId(agentId) : undefined,
      initiatedBy: req.user._id,
      type: 'PAYMENT',
      status: 'PENDING',
      amount: {
        value: Number(amount),
        currency,
        precision: 2,
      },
      fees: {
        platform: 0,
        payment: 0,
        total: 0,
        currency,
      },
      netAmount: Number(amount),
      paymentMethod: {
        type: paymentMethodType,
        provider: paymentProvider,
        methodId: paymentMethodId,
        details: metadata.paymentMethodDetails ?? {},
      },
      mandateChain: [],
      parties: {
        payer: {
          type: 'USER',
          id: req.user._id,
          name: payerName,
          email: req.user.email,
        },
        payee: {
          type: 'MERCHANT',
          name: metadata.payeeName ?? payeeName,
          email: metadata.payeeEmail,
          merchantId: metadata.merchantId,
        },
      },
      externalProvider: {
        provider: paymentProvider.toLowerCase(),
        providerId: metadata.providerTransactionId ?? `temp_${Date.now()}`,
        providerStatus: 'pending',
        providerResponse: {},
        webhookData: [],
      },
      metadata: {
        description,
        reference: metadata.reference,
        invoiceId: metadata.invoiceId,
        orderId: metadata.orderId,
        tags: metadata.tags ?? [],
        agentExecutionId: metadata.agentExecutionId
          ? toObjectId(metadata.agentExecutionId)
          : undefined,
        userAgent: req.get('User-Agent') ?? undefined,
        ipAddress: req.ip,
        deviceFingerprint: metadata.deviceFingerprint,
      },
      riskAssessment: {
        score: 0,
        level: 'LOW',
        reasons: [],
        reviewRequired: false,
      },
      timeline: [],
      settlement: {
        status: 'PENDING',
      },
      childTransactions: [],
    });

    await transaction.addTimelineEvent('PENDING', 'Transaction created');

    logger.transaction('Created transaction', {
      tenantId: req.tenant._id.toString(),
      transactionId: transaction._id.toString(),
      amount,
      currency,
    });

    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const {
      page = 1,
      limit = 20,
      sort = 'desc',
      sortBy = 'createdAt',
      status,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      agentId,
    } = req.query;

    const query: Record<string, unknown> = {
      tenantId: req.tenant._id,
    };

    if (status) query.status = status;
    if (type) query.type = type;
    if (agentId) query.agentId = toObjectId(agentId as string);

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        (query.createdAt as any).$gte = new Date(startDate as string);
      }
      if (endDate) {
        (query.createdAt as any).$lte = new Date(endDate as string);
      }
    }

    if (minAmount || maxAmount) {
      query['amount.value'] = {};
      if (minAmount) {
        (query['amount.value'] as any).$gte = Number(minAmount);
      }
      if (maxAmount) {
        (query['amount.value'] as any).$lte = Number(maxAmount);
      }
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ [sortBy as string]: sort === 'asc' ? 1 : -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Transaction.countDocuments(query),
    ]);

    res.json({
      data: transactions,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!transaction) {
      throw new CustomError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const updates: Record<string, unknown> = {};
    const { status, metadata } = req.body;

    if (status) {
      updates.status = status;
    }

    if (metadata) {
      updates['metadata'] = {
        ...metadata,
        userAgent: metadata.userAgent ?? req.get('User-Agent'),
        ipAddress: metadata.ipAddress ?? req.ip,
      };
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { $set: updates },
      { new: true }
    );

    if (!transaction) {
      throw new CustomError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    if (status) {
      await transaction.addTimelineEvent(status, 'Status updated via API');
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const cancelTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!transaction) {
      throw new CustomError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    if (!transaction.canCancel()) {
      throw new CustomError('Transaction cannot be cancelled', 400, 'CANNOT_CANCEL');
    }

    await transaction.updateStatus('CANCELLED', 'Cancelled via API');

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const refundTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!transaction) {
      throw new CustomError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    if (!transaction.canRefund()) {
      throw new CustomError('Transaction cannot be refunded', 400, 'CANNOT_REFUND');
    }

    await transaction.addTimelineEvent('REFUND_INITIATED', 'Refund initiated via API');
    await transaction.updateStatus('REFUNDED', 'Transaction refunded via API');

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const getTransactionAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const { startDate, endDate } = req.query;

    const match: Record<string, unknown> = {
      tenantId: req.tenant._id,
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) {
        (match.createdAt as any).$gte = new Date(startDate as string);
      }
      if (endDate) {
        (match.createdAt as any).$lte = new Date(endDate as string);
      }
    }

    const [summary] = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount.value' },
          netAmount: { $sum: '$netAmount' },
        },
      },
    ]);

    const totalCount = await Transaction.countDocuments(match);

    res.json({
      totalCount,
      summary: summary || [],
    });
  } catch (error) {
    next(error);
  }
};

export const exportTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenant) {
      throw new CustomError('Tenant context required', 400, 'TENANT_REQUIRED');
    }

    const transactions = await Transaction.find({ tenantId: req.tenant._id })
      .sort({ createdAt: -1 })
      .limit(5000);

    const header = [
      'id',
      'status',
      'type',
      'amount',
      'currency',
      'netAmount',
      'createdAt',
    ];

    const rows = transactions.map(tx =>
      [
        tx._id.toString(),
        tx.status,
        tx.type,
        tx.amount.value.toFixed(2),
        tx.amount.currency,
        tx.netAmount.toFixed(2),
        tx.createdAt.toISOString(),
      ].join(',')
    );

    const csv = [header.join(','), ...rows].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
