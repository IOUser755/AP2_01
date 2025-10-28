import { Helmet } from 'react-helmet-async';
import { AnalyticsDashboard } from '@components/analytics/AnalyticsDashboard';

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Analytics | AgentPay Hub</title>
      </Helmet>
      <AnalyticsDashboard />
    </div>
  );
}

export default AnalyticsPage;
