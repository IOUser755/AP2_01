import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

function AgentsPage() {
  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Agents | AgentPay Hub</title>
      </Helmet>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Payment agents</h1>
          <p className="text-slate-400">Manage and monitor all autonomous payment workflows.</p>
        </div>
        <Link
          to="/agents/new"
          className="rounded bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
        >
          Create agent
        </Link>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Agent list coming soon.</p>
      </div>
    </div>
  );
}

export default AgentsPage;
