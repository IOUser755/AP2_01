import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

function TransactionDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Transaction details | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Transaction #{id}</h1>
        <p className="text-slate-400">Mandate lineage, risk events, and settlement data.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Transaction detail view coming soon.</p>
      </div>
    </div>
  );
}

export default TransactionDetailsPage;
