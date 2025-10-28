import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

function TransactionDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Transaction details | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Transaction #{id}</h1>
        <p className="text-sm text-gray-500">Lifecycle events, provider metadata, and settlement information.</p>
      </header>
      <section className="card">
        <p className="text-gray-600">Detailed transaction view coming soon.</p>
      </section>
    </div>
  );
}

export default TransactionDetailsPage;
