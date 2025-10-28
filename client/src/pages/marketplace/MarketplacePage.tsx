import { Helmet } from 'react-helmet-async';

function MarketplacePage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Template marketplace | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Template marketplace</h1>
        <p className="text-sm text-gray-500">Discover prebuilt AI payment agents, integrations, and workflow accelerators.</p>
      </header>
      <section className="card">
        <p className="text-gray-600">Marketplace listing coming soon.</p>
      </section>
    </div>
  );
}

export default MarketplacePage;
