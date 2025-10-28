import mongoose from 'mongoose';
import AgentOrchestrator from '../../services/agent/AgentOrchestrator.js';
import Agent from '../../models/Agent.js';
import { createTestTenant, createTestUser, createTestAgent } from '../setup.js';
import { jest } from '@jest/globals';

jest.mock('../../server.js', () => ({
  __esModule: true,
  default: {
    getIO: () => ({
      to: () => ({ emit: () => undefined }),
    }),
  },
}));

const mockValidateResult = { isValid: true, errors: [], warnings: [], suggestions: [] };

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let tenantId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;
  let agentId: mongoose.Types.ObjectId;
  let toolExecuteMocks: Record<string, jest.Mock>;

  beforeEach(async () => {
    const tenant = await createTestTenant();
    const user = await createTestUser(tenant._id);
    const agent = await createTestAgent(tenant._id, user._id);

    tenantId = tenant._id;
    userId = user._id;
    agentId = agent._id;

    jest.spyOn(Agent.prototype, 'updateMetrics').mockResolvedValue();

    orchestrator = new AgentOrchestrator();

    const workflowEngine = (orchestrator as any).workflowEngine;
    jest
      .spyOn(workflowEngine, 'validateWorkflow')
      .mockReturnValue(mockValidateResult);
    jest
      .spyOn(workflowEngine, 'getExecutionOrder')
      .mockImplementation((workflow: any[]) => workflow);

    toolExecuteMocks = {
      manual_trigger: jest.fn().mockResolvedValue({}),
      test_tool: jest.fn().mockResolvedValue({ paymentId: 'pay_123' }),
    };

    (orchestrator as any).toolRegistry = {
      getTool: jest.fn((toolType: string) => ({
        execute: toolExecuteMocks[toolType] || jest.fn().mockResolvedValue({}),
        rollback: jest.fn(),
      })),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('executes an agent workflow successfully', async () => {
    const result = await orchestrator.executeAgent(
      agentId,
      {
        tenantId,
        userId,
        metadata: { requestId: 'req-1' },
      },
      { amount: 250, currency: 'USD', customer: 'Jane Doe' }
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.metrics.totalSteps).toBeGreaterThan(0);
    expect(toolExecuteMocks.manual_trigger).toHaveBeenCalled();
    expect(toolExecuteMocks.test_tool).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250, currency: 'USD' }),
      expect.objectContaining({ executionId: result.executionId })
    );
  });

  it('throws when a tool execution fails', async () => {
    toolExecuteMocks.test_tool.mockRejectedValueOnce(new Error('Tool failure'));

    await expect(
      orchestrator.executeAgent(
        agentId,
        {
          tenantId,
          userId,
        },
        { amount: 100, currency: 'USD' }
      )
    ).rejects.toThrow('Tool failure');
  });

  it('resolves nested template variables within step parameters', () => {
    const resolveParameters = (orchestrator as any).resolveParameters.bind(orchestrator);

    const resolved = resolveParameters(
      {
        amount: '${payment.amount}',
        currency: '${payment.currency}',
        customer: {
          name: '${customer.name}',
          email: '${customer.email}',
        },
      },
      {
        payment: { amount: 99, currency: 'EUR' },
        customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      }
    );

    expect(resolved).toEqual({
      amount: 99,
      currency: 'EUR',
      customer: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    });
  });
});
