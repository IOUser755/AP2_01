import { Helmet } from 'react-helmet-async';

function TransactionsPage() {
  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Transactions | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Transactions</h1>
        <p className="text-slate-400">Track payment flows, authorizations, refunds, and settlements.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Transaction explorer coming soon.</p>
      </div>
    </div>
  );
}

export default TransactionsPage;
