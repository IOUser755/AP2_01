import { Helmet } from 'react-helmet-async';

function DashboardPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Dashboard | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Command center</h1>
        <p className="text-sm text-gray-500">
          Operational visibility for payment agents, transaction health, and compliance automation.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <h2 className="text-sm font-semibold text-gray-500">Active agents</h2>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </article>
        <article className="card">
          <h2 className="text-sm font-semibold text-gray-500">Transactions (24h)</h2>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </article>
        <article className="card">
          <h2 className="text-sm font-semibold text-gray-500">Alerts</h2>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </article>
      </section>
      <section className="card">
        <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
        <p className="mt-2 text-sm text-gray-600">Workflow analytics will appear here.</p>
      </section>
    </div>
  );
}

export default DashboardPage;
