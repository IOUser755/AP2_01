import { Helmet } from 'react-helmet-async';

function MarketplacePage() {
  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Template marketplace | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Template marketplace</h1>
        <p className="text-slate-400">Discover prebuilt agent workflows from the AgentPay ecosystem.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Marketplace coming soon.</p>
      </div>
    </div>
  );
}

export default MarketplacePage;
