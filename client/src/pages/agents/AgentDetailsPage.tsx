import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

function AgentDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Agent details | AgentPay Hub</title>
      </Helmet>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agent #{id}</h1>
          <p className="text-sm text-gray-500">Operational insights, workflow configuration, and performance analytics.</p>
        </div>
        <Link to={`/agents/${id}/edit`} className="btn-primary">
          Edit agent
        </Link>
      </header>
      <section className="card">
        <p className="text-gray-600">Detailed agent view coming soon.</p>
      </section>
    </div>
  );
}

export default AgentDetailsPage;
