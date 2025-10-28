import { Helmet } from 'react-helmet-async';

function SettingsPage() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Workspace settings | AgentPay Hub</title>
      </Helmet>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Workspace settings</h1>
        <p className="text-sm text-gray-500">Manage organization preferences, billing, and security policies.</p>
      </header>
      <section className="card">
        <p className="text-gray-600">Settings management coming soon.</p>
      </section>
    </div>
  );
}

export default SettingsPage;
