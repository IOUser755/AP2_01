import type { ComponentType } from 'react';

import {
  BeakerIcon,
  BoltIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import type { WorkflowStep } from '@types/agent';

export type BuilderPanel = 'tools' | 'constraints' | 'testing';

export interface BuilderToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  stepType: WorkflowStep['type'];
  category: 'triggers' | 'actions' | 'conditions' | 'approvals';
  color: string;
}

export const BUILDER_TABS: Array<{
  id: BuilderPanel;
  name: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'tools', name: 'Tools', icon: WrenchScrewdriverIcon },
  { id: 'constraints', name: 'Constraints', icon: Cog6ToothIcon },
  { id: 'testing', name: 'Testing', icon: BeakerIcon },
];

export const BUILDER_TOOL_DEFINITIONS: BuilderToolDefinition[] = [
  {
    id: 'trigger_manual',
    name: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: PlayIcon,
    stepType: 'TRIGGER',
    category: 'triggers',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'trigger_webhook',
    name: 'Webhook Trigger',
    description: 'Start on HTTP request',
    icon: BoltIcon,
    stepType: 'TRIGGER',
    category: 'triggers',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'trigger_schedule',
    name: 'Schedule Trigger',
    description: 'Start on a defined schedule',
    icon: Cog6ToothIcon,
    stepType: 'TRIGGER',
    category: 'triggers',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'action_search_products',
    name: 'Search Products',
    description: 'Find products matching criteria',
    icon: MagnifyingGlassIcon,
    stepType: 'ACTION',
    category: 'actions',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'action_add_to_cart',
    name: 'Add to Cart',
    description: 'Add items to shopping cart',
    icon: ShoppingCartIcon,
    stepType: 'ACTION',
    category: 'actions',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'action_payment_stripe',
    name: 'Stripe Payment',
    description: 'Process payment via Stripe',
    icon: CurrencyDollarIcon,
    stepType: 'ACTION',
    category: 'actions',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'action_send_email',
    name: 'Send Email',
    description: 'Send notification email',
    icon: EnvelopeIcon,
    stepType: 'ACTION',
    category: 'actions',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'condition_price_check',
    name: 'Price Check',
    description: 'Check if price meets criteria',
    icon: ExclamationCircleIcon,
    stepType: 'CONDITION',
    category: 'conditions',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 'condition_inventory_check',
    name: 'Inventory Check',
    description: 'Verify item availability',
    icon: CheckCircleIcon,
    stepType: 'CONDITION',
    category: 'conditions',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 'approval_human',
    name: 'Human Approval',
    description: 'Require manual approval',
    icon: CheckCircleIcon,
    stepType: 'APPROVAL',
    category: 'approvals',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'approval_budget',
    name: 'Budget Approval',
    description: 'Auto-approve within budget',
    icon: CurrencyDollarIcon,
    stepType: 'APPROVAL',
    category: 'approvals',
    color: 'bg-purple-100 text-purple-600',
  },
];

export const TOOL_CATEGORY_METADATA: Record<
  BuilderToolDefinition['category'],
  {
    name: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  triggers: {
    name: 'Triggers',
    description: 'Start your workflow',
    icon: BoltIcon,
  },
  actions: {
    name: 'Actions',
    description: 'Perform operations and external calls',
    icon: WrenchScrewdriverIcon,
  },
  conditions: {
    name: 'Conditions',
    description: 'Add decision points and branching logic',
    icon: ExclamationCircleIcon,
  },
  approvals: {
    name: 'Approvals',
    description: 'Inject human oversight into the workflow',
    icon: CheckCircleIcon,
  },
};

export const getToolsByStepType = (type: WorkflowStep['type']) =>
  BUILDER_TOOL_DEFINITIONS.filter((tool) => tool.stepType === type);
