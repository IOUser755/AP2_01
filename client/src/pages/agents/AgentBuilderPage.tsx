import { Helmet } from 'react-helmet-async';

function AgentBuilderPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Agent builder | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Visual agent builder</h1>
        <p className="text-sm text-gray-500">
          Design workflows, configure triggers, and orchestrate payment approvals with guardrails.
        </p>
      </header>
      <section className="card">
        <p className="text-gray-600">Visual builder coming soon.</p>
      </section>
    </div>
  );
}

export default AgentBuilderPage;
