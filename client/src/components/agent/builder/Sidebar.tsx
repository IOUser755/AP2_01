import React from 'react';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

import { Card, CardBody, CardHeader, CardTitle } from '@components/common/Card';
import { Badge } from '@components/common/Badge';

const toolCategories = [
  {
    name: 'Triggers',
    description: 'How executions get started',
    items: [
      { type: 'trigger', label: 'Manual Trigger', icon: '▶️' },
      { type: 'trigger', label: 'Schedule Trigger', icon: '⏰' },
      { type: 'trigger', label: 'Webhook Trigger', icon: '🔗' },
      { type: 'trigger', label: 'Event Trigger', icon: '⚡️' },
    ],
  },
  {
    name: 'Payment Actions',
    description: 'Collect or refund funds',
    items: [
      { type: 'action', label: 'Stripe Payment', icon: '💳' },
      { type: 'action', label: 'Crypto Payment', icon: '₿' },
      { type: 'action', label: 'Bank Transfer', icon: '🏦' },
      { type: 'action', label: 'Refund', icon: '↩️' },
    ],
  },
  {
    name: 'Data Actions',
    description: 'Fetch, enrich, and store data',
    items: [
      { type: 'action', label: 'HTTP Request', icon: '🌐' },
      { type: 'action', label: 'Database Query', icon: '🗄️' },
      { type: 'action', label: 'File Upload', icon: '📁' },
      { type: 'action', label: 'Email Send', icon: '📧' },
    ],
  },
  {
    name: 'Logic',
    description: 'Control and branching tools',
    items: [
      { type: 'condition', label: 'If / Else', icon: '🔀' },
      { type: 'condition', label: 'Switch', icon: '🎛️' },
      { type: 'action', label: 'Loop', icon: '🔄' },
      { type: 'action', label: 'Delay', icon: '⏱️' },
    ],
  },
  {
    name: 'Outputs',
    description: 'How results are delivered',
    items: [
      { type: 'output', label: 'JSON Response', icon: '📄' },
      { type: 'output', label: 'Webhook', icon: '📤' },
      { type: 'output', label: 'Notification', icon: '🔔' },
    ],
  },
] as const;

interface SidebarProps {
  onDragStart?: (event: React.DragEvent, nodeType: string, label: string) => void;
}

const defaultOnDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.setData('application/label', label);
  event.dataTransfer.effectAllowed = 'move';
};

export const Sidebar: React.FC<SidebarProps> = ({ onDragStart = defaultOnDragStart }) => {
  return (
    <aside className="flex w-72 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tool Palette</h2>
          <p className="text-sm text-gray-500">Drag nodes onto the canvas to compose workflows.</p>
        </div>
        <Squares2X2Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {toolCategories.map(category => (
          <Card key={category.name} padding="sm" className="border-gray-200">
            <CardHeader className="flex-col items-start gap-1 pb-3">
              <div className="flex w-full items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold text-gray-900">{category.name}</CardTitle>
                <Badge variant="gray" size="sm">
                  {category.items.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{category.description}</p>
            </CardHeader>
            <CardBody className="space-y-2">
              {category.items.map(item => (
                <button
                  key={`${category.name}-${item.label}`}
                  type="button"
                  draggable
                  onDragStart={event => onDragStart(event, item.type, item.label)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-gray-400">{item.type}</span>
                </button>
              ))}
            </CardBody>
          </Card>
        ))}

        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800 shadow-sm">
          <h3 className="mb-1 font-semibold uppercase tracking-wide">Quick tip</h3>
          <p>
            Drop tools into the canvas, then select any node to refine its configuration. Use the validator panel to
            ensure the workflow is production ready.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
