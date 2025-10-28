import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

function AgentDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Agent details | AgentPay Hub</title>
      </Helmet>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Agent #{id}</h1>
          <p className="text-slate-400">Operational insights, workflow configuration, and analytics.</p>
        </div>
        <Link to={`/agents/${id}/edit`} className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          Edit agent
        </Link>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Detailed view coming soon.</p>
      </div>
    </div>
  );
}

export default AgentDetailsPage;
