import { Helmet } from 'react-helmet-async';

function IntegrationsPage() {
  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Integrations | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Integrations</h1>
        <p className="text-slate-400">Connect payment processors, data warehouses, CRMs, and more.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Integration catalog coming soon.</p>
      </div>
    </div>
  );
}

export default IntegrationsPage;
