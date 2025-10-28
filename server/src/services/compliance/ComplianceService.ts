import { AuditLog, Transaction, Mandate } from '../../models/index.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

interface ComplianceIssue {
  type: 'FRAUD_ALERT' | 'MANDATE_VIOLATION' | 'PCI_VIOLATION' | 'AML_ALERT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: Date;
  resourceId: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

interface ComplianceReport {
  period: { start: Date; end: Date };
  transactionCount: number;
  totalVolume: number;
  mandateCompliance: number;
  fraudAlerts: number;
  pciCompliance: boolean;
  issues: ComplianceIssue[];
}

class ComplianceService {
  async generateComplianceReport(tenantId: string, startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      const transactions = await Transaction.find({
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const mandates = await Mandate.find({
        tenantId,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const transactionCount = transactions.length;
      const totalVolume = transactions.reduce((sum: number, tx: any) => sum + (tx.amount?.value ?? 0), 0);
      const mandateCompliance = this.calculateMandateCompliance(transactions, mandates);
      const fraudAlerts = await this.getFraudAlerts(tenantId, startDate, endDate);
      const pciCompliance = await this.checkPCICompliance(tenantId);
      const issues = await this.getComplianceIssues(tenantId, startDate, endDate);

      const report: ComplianceReport = {
        period: { start: startDate, end: endDate },
        transactionCount,
        totalVolume,
        mandateCompliance,
        fraudAlerts: fraudAlerts.length,
        pciCompliance,
        issues,
      };

      await AuditLog.create({
        tenantId,
        action: 'COMPLIANCE_REPORT_GENERATED',
        resource: 'ComplianceReport',
        changes: { reportPeriod: { startDate, endDate } },
        metadata: { reportStats: report },
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', error instanceof Error ? error : new Error(String(error)));
      throw new AppError('Compliance report generation failed', {
        statusCode: 500,
        code: 'COMPLIANCE_REPORT_FAILED',
      });
    }
  }

  async detectFraud(transaction: any): Promise<boolean> {
    const riskFactors: string[] = [];

    if (transaction.amount?.value > 10000) {
      riskFactors.push('HIGH_AMOUNT');
    }

    const recentTransactions = await Transaction.find({
      tenantId: transaction.tenantId,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentTransactions.length > 5) {
      riskFactors.push('HIGH_FREQUENCY');
    }

    const isFraudulent = riskFactors.length >= 2;

    if (isFraudulent) {
      await this.createFraudAlert(transaction, riskFactors);
    }

    return isFraudulent;
  }

  private calculateMandateCompliance(transactions: any[], mandates: any[]): number {
    if (transactions.length === 0) {
      return 100;
    }

    const mandateMap = new Map(
      mandates
        .filter((mandate) => mandate.transactionId)
        .map((mandate) => [mandate.transactionId.toString(), mandate]),
    );

    const compliantTransactions = transactions.filter((transaction) => {
      const mandate = mandateMap.get(transaction._id.toString());
      return mandate?.status === 'APPROVED' || mandate?.status === 'EXECUTED' || mandate?.status === 'SIGNED';
    });

    return (compliantTransactions.length / transactions.length) * 100;
  }

  private async getFraudAlerts(tenantId: string, startDate: Date, endDate: Date) {
    return AuditLog.find({
      tenantId,
      action: 'FRAUD_ALERT_CREATED',
      createdAt: { $gte: startDate, $lte: endDate },
    });
  }

  private async checkPCICompliance(_tenantId: string): Promise<boolean> {
    // Placeholder for real PCI DSS checks
    return true;
  }

  private async getComplianceIssues(tenantId: string, startDate: Date, endDate: Date): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    const mandateViolations = await AuditLog.find({
      tenantId,
      action: 'MANDATE_VIOLATION',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    for (const violation of mandateViolations) {
      issues.push({
        type: 'MANDATE_VIOLATION',
        severity: 'HIGH',
        description: (violation.metadata as any)?.description || 'Mandate violation detected',
        timestamp: violation.createdAt,
        resourceId: violation.resourceId?.toString() ?? '',
        status: 'OPEN',
      });
    }

    return issues;
  }

  private async createFraudAlert(transaction: any, riskFactors: string[]): Promise<void> {
    await AuditLog.create({
      tenantId: transaction.tenantId,
      action: 'FRAUD_ALERT_CREATED',
      resource: 'Transaction',
      resourceId: transaction._id,
      changes: { riskFactors },
      metadata: {
        severity: 'HIGH',
        requiresReview: true,
      },
    });

    logger.warn('Fraud alert created', {
      transactionId: transaction._id,
      tenantId: transaction.tenantId,
      riskFactors,
    });
  }
}

export const complianceService = new ComplianceService();

export default ComplianceService;
