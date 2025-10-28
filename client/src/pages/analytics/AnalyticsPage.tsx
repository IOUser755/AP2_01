import { Helmet } from 'react-helmet-async';

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Analytics | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics & reporting</h1>
        <p className="text-sm text-gray-500">
          Visualize transaction health, revenue performance, and compliance posture in real time.
        </p>
      </header>
      <section className="card">
        <p className="text-gray-600">Analytics dashboards coming soon.</p>
      </section>
    </div>
  );
}

export default AnalyticsPage;
