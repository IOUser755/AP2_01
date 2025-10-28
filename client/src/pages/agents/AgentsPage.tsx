import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  RocketLaunchIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

import {
  useAgents,
  useDeleteAgent,
  useUpdateAgent,
  useCloneAgent,
  useExecuteAgent,
} from '@hooks/useAgents';
import { Card, CardBody } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Badge } from '@components/common/Badge';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Table } from '@components/common/Table';
import { Modal, ModalBody, ModalFooter } from '@components/common/Modal';
import type { Agent } from '@types/agent';

export const AgentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

    const { data: agentsData, isLoading } = useAgents({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    });

  const deleteAgentMutation = useDeleteAgent();
  const updateAgentMutation = useUpdateAgent();
  const cloneAgentMutation = useCloneAgent();
  const executeAgentMutation = useExecuteAgent();

    const agents = agentsData?.data ?? [];

  const handleStatusToggle = async (agent: Agent) => {
    const newStatus = agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateAgentMutation.mutateAsync({
        id: agent._id,
        data: { status: newStatus },
      });
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  const handleCloneAgent = async (agent: Agent) => {
    try {
      await cloneAgentMutation.mutateAsync({
        id: agent._id,
        name: `${agent.name} (Copy)`,
      });
    } catch (error) {
      toast.error('Failed to clone agent');
    }
  };

  const handleExecuteAgent = async (agent: Agent) => {
    try {
      await executeAgentMutation.mutateAsync({
        id: agent._id,
        context: { manual: true },
      });
    } catch (error) {
      toast.error('Failed to execute agent');
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;

    try {
      await deleteAgentMutation.mutateAsync(agentToDelete._id);
      setDeleteModalOpen(false);
      setAgentToDelete(null);
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    const variants: Record<Agent['status'], 'success' | 'warning' | 'error' | 'gray'> = {
      ACTIVE: 'success',
      PAUSED: 'warning',
      DRAFT: 'gray',
      ARCHIVED: 'gray',
      ERROR: 'error',
    };
    return variants[status];
  };

  const getTypeBadge = (type: Agent['type']) => {
    const variants: Record<Agent['type'], 'primary' | 'secondary' | 'warning' | 'success' | 'gray'> = {
      PAYMENT: 'primary',
      WORKFLOW: 'secondary',
      DATA_PROCESSOR: 'warning',
      NOTIFICATION: 'success',
      CUSTOM: 'gray',
    };
    return variants[type];
  };

  const columns = [
    {
      key: 'name',
      header: 'Agent Name',
      sortable: true,
      render: (value: string, agent: Agent) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <RocketLaunchIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <Link to={`/agents/${agent._id}`} className="font-medium text-gray-900 hover:text-primary-600">
              {value}
            </Link>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: Agent['type']) => (
        <Badge variant={getTypeBadge(value)} size="sm">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: Agent['status']) => (
        <Badge variant={getStatusBadge(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'metrics',
      header: 'Performance',
      render: (_value: Agent['metrics'], agent: Agent) => (
        <div className="text-sm">
          <div className="text-gray-900 font-medium">
            {agent.metrics.successfulExecutions}/{agent.metrics.totalExecutions} success
          </div>
          <div className="text-gray-500">
            {agent.metrics.totalExecutions > 0
              ? `${(
                  (agent.metrics.successfulExecutions / agent.metrics.totalExecutions) *
                  100
                ).toFixed(1)}% rate`
              : 'No executions'}
          </div>
        </div>
      ),
    },
    {
      key: 'lastExecutedAt',
      header: 'Last Run',
      render: (value: string | Date | undefined) => (
        <span className="text-sm text-gray-500">
          {value ? format(new Date(value), 'MMM d, h:mm a') : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: unknown, agent: Agent) => (
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 rounded-md hover:bg-gray-100">
            <EllipsisVerticalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleExecuteAgent(agent)}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <PlayIcon className="mr-3 h-4 w-4" />
                    Execute
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to={`/agents/${agent._id}/edit`}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <PencilIcon className="mr-3 h-4 w-4" />
                    Edit
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(agent)}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    {agent.status === 'ACTIVE' ? (
                      <PauseIcon className="mr-3 h-4 w-4" />
                    ) : (
                      <PlayIcon className="mr-3 h-4 w-4" />
                    )}
                    {agent.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleCloneAgent(agent)}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <DocumentDuplicateIcon className="mr-3 h-4 w-4" />
                    Clone
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to={`/agents/${agent._id}/analytics`}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <ChartBarIcon className="mr-3 h-4 w-4" />
                    Analytics
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => {
                      setAgentToDelete(agent);
                      setDeleteModalOpen(true);
                    }}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'flex items-center w-full px-4 py-2 text-sm text-red-700'
                    )}
                  >
                    <TrashIcon className="mr-3 h-4 w-4" />
                    Delete
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-gray-500">Manage and monitor your payment agents</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/agents/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(prev => !prev)}>
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={event => setTypeFilter(event.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="WORKFLOW">Workflow</option>
                  <option value="DATA_PROCESSOR">Data Processor</option>
                  <option value="NOTIFICATION">Notification</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : agents.length > 0 ? (
            <Table data={agents} columns={columns} emptyMessage="No agents found" />
          ) : (
            <div className="text-center py-12">
              <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first agent.</p>
              <div className="mt-6">
                <Link to="/agents/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Agent">
        <ModalBody>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete "{agentToDelete?.name}"? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAgent} loading={deleteAgentMutation.isPending}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AgentsPage;
