import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

function AgentsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Agents | AgentPay Hub</title>
      </Helmet>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment agents</h1>
          <p className="text-sm text-gray-500">Manage, monitor, and iterate on autonomous payment workflows.</p>
        </div>
        <Link to="/agents/new" className="btn-primary">
          Create agent
        </Link>
      </header>
      <section className="card">
        <p className="text-gray-600">Agent list coming soon.</p>
      </section>
    </div>
  );
}

export default AgentsPage;
