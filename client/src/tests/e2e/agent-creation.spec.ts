import { expect, test } from '@playwright/test';

test.describe('Agent Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create a complete payment agent', async ({ page }) => {
    await page.click('[data-testid="agents-nav"]');
    await page.click('[data-testid="create-agent-button"]');

    await page.fill('[data-testid="agent-name"]', 'E2E Test Payment Agent');
    await page.fill('[data-testid="agent-description"]', 'Payment agent created via E2E test');
    await page.selectOption('[data-testid="agent-type"]', 'PAYMENT');

    const manualTrigger = page.locator('[data-testid="tool-manual-trigger"]');
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    await manualTrigger.dragTo(canvas);

    const stripePayment = page.locator('[data-testid="tool-stripe-payment"]');
    await stripePayment.dragTo(canvas);

    await page.click('[data-testid="node-stripe-payment"]');
    await page.fill('[data-testid="amount-input"]', '${amount}');
    await page.selectOption('[data-testid="currency-select"]', 'USD');

    await page.click('[data-testid="save-agent-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Agent saved successfully'
    );

    await page.click('[data-testid="agents-nav"]');
    await expect(page.locator('[data-testid="agent-list"]')).toContainText(
      'E2E Test Payment Agent'
    );
  });

  test('should execute payment agent', async ({ page }) => {
    await page.goto('http://localhost:3000/agents');

    await page.click('[data-testid="agent-E2E Test Payment Agent"]');
    await page.click('[data-testid="execute-agent-button"]');

    await page.fill('[data-testid="variable-amount"]', '100');
    await page.selectOption('[data-testid="variable-currency"]', 'USD');

    await page.click('[data-testid="start-execution-button"]');

    await expect(page.locator('[data-testid="execution-status"]')).toContainText('RUNNING');
    await expect(page.locator('[data-testid="execution-status"]')).toContainText('COMPLETED', {
      timeout: 30_000,
    });

    await page.click('[data-testid="transactions-nav"]');
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('$100.00');
  });

  test('should handle execution errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/agents');
    await page.click('[data-testid="agent-E2E Test Payment Agent"]');

    await page.click('[data-testid="execute-agent-button"]');
    await page.fill('[data-testid="variable-amount"]', '-100');
    await page.click('[data-testid="start-execution-button"]');

    await expect(page.locator('[data-testid="execution-status"]')).toContainText('FAILED');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Amount must be greater than 0'
    );
  });
});
