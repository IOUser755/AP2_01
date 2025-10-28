import React from 'react';
import { Link } from 'react-router-dom';
import {
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuth } from '@hooks/useAuth';
import { useAgents } from '@hooks/useAgents';
import { useWebSocket } from '@context/WebSocketContext';
import { Card, CardHeader, CardTitle, CardBody } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

const transactionData = [
  { name: 'Mon', transactions: 12 },
  { name: 'Tue', transactions: 19 },
  { name: 'Wed', transactions: 8 },
  { name: 'Thu', transactions: 25 },
  { name: 'Fri', transactions: 18 },
  { name: 'Sat', transactions: 15 },
  { name: 'Sun', transactions: 9 },
];

const agentTypeData = [
  { name: 'Payment', value: 45, color: '#3B82F6' },
  { name: 'Workflow', value: 30, color: '#10B981' },
  { name: 'Data Processing', value: 25, color: '#F59E0B' },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { data: agentsData, isLoading: agentsLoading } = useAgents({ limit: 5 });

  const totalAgents = agentsData?.pagination?.total ?? agentsData?.data?.length ?? 0;
  const recentAgents = agentsData?.data ?? [];

  const stats = [
    {
      name: 'Total Agents',
      value: totalAgents.toString(),
      change: totalAgents > 0 ? '+2' : '+0',
      changeType: 'increase' as const,
      icon: RocketLaunchIcon,
    },
    {
      name: 'This Month',
      value: '$45,231',
      change: '+12%',
      changeType: 'increase' as const,
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Success Rate',
      value: '98.1%',
      change: '+0.3%',
      changeType: 'increase' as const,
      icon: ChartBarIcon,
    },
    {
      name: 'Avg. Response',
      value: '2.4s',
      change: '-0.2s',
      changeType: 'decrease' as const,
      icon: ClockIcon,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}! 👋</h1>
          <p className="mt-1 text-gray-500">Here's what's happening with your agents today.</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-error-500'}`} />
            <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <Link to="/agents/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <Card key={stat.name} className="relative overflow-hidden">
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <ArrowTrendingUpIcon
                          className={`self-center flex-shrink-0 h-4 w-4 ${
                            stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500 rotate-180'
                          }`}
                        />
                        <span className="sr-only">
                          {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Trends</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agentTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {agentTypeData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Agents</CardTitle>
              <Link to="/agents" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {agentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentAgents.length > 0 ? (
              <div className="space-y-4">
                {recentAgents.slice(0, 5).map(agent => (
                  <div key={agent._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <RocketLaunchIcon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <Link
                          to={`/agents/${agent._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {agent.name}
                        </Link>
                        <p className="text-xs text-gray-500 capitalize">{agent.type.toLowerCase()}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        agent.status === 'ACTIVE'
                          ? 'success'
                          : agent.status === 'DRAFT'
                          ? 'warning'
                          : agent.status === 'ERROR'
                          ? 'error'
                          : 'gray'
                      }
                      size="sm"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <RocketLaunchIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No agents created yet</p>
                <Link to="/agents/new">
                  <Button size="sm" className="mt-3">
                    Create your first agent
                  </Button>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">API Rate Limit Warning</p>
                  <p className="text-xs text-yellow-600">You're approaching your monthly API limit (85% used)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Performance Update</p>
                  <p className="text-xs text-blue-600">Your agents have improved 15% in efficiency this week</p>
                </div>
              </div>

              <div className="text-center py-4">
                <Link to="/settings/notifications" className="text-sm text-primary-600 hover:text-primary-500">
                  Manage alert preferences
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/agents/new">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
                <PlusIcon className="h-6 w-6 text-primary-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Create Agent</h3>
                <p className="text-xs text-gray-500">Build a new payment agent</p>
              </div>
            </Link>

            <Link to="/marketplace">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
                <RocketLaunchIcon className="h-6 w-6 text-primary-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Browse Templates</h3>
                <p className="text-xs text-gray-500">Explore pre-built agents</p>
              </div>
            </Link>

            <Link to="/transactions">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">View Transactions</h3>
                <p className="text-xs text-gray-500">Monitor payment activity</p>
              </div>
            </Link>

            <Link to="/integrations">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
                <ChartBarIcon className="h-6 w-6 text-primary-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Add Integration</h3>
                <p className="text-xs text-gray-500">Connect external services</p>
              </div>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;
