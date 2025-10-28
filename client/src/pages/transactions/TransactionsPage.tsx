import { Helmet } from 'react-helmet-async';

function TransactionsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Transactions | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Transaction monitoring</h1>
        <p className="text-sm text-gray-500">
          Track payment volume, risk posture, and settlement health across every agent workflow.
        </p>
      </header>
      <section className="card">
        <p className="text-gray-600">Transaction table coming soon.</p>
      </section>
    </div>
  );
}

export default TransactionsPage;
