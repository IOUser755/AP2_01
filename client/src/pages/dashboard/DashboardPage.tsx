import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../hooks/useAuth.ts';

function DashboardPage() {
  const { user, tenant } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <Helmet>
        <title>Dashboard | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold text-white">Welcome back, {user?.firstName}</h1>
        <p className="text-slate-400">You are managing the {tenant?.name} workspace.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-200">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Active agents</h2>
          <p className="mt-2 text-4xl font-semibold">12</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-200">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Transactions (24h)</h2>
          <p className="mt-2 text-4xl font-semibold">842</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-200">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Success rate</h2>
          <p className="mt-2 text-4xl font-semibold">98.4%</p>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
