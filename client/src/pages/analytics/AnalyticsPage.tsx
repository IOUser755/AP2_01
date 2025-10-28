import { Helmet } from 'react-helmet-async';

function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Analytics | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="text-slate-400">Monitor performance, conversion funnels, and mandate outcomes.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Analytics dashboards coming soon.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
