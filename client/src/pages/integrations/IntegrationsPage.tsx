import { Helmet } from 'react-helmet-async';

function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Integrations | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">
          Connect payment providers, risk engines, and compliance services to your agent workflows.
        </p>
      </header>
      <section className="card">
        <p className="text-gray-600">Integration catalog coming soon.</p>
      </section>
    </div>
  );
}

export default IntegrationsPage;
