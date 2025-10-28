import { Helmet } from 'react-helmet-async';
import { useTheme } from '../../hooks/useTheme.ts';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>Settings | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">Workspace settings</h1>
        <p className="text-slate-400">Manage authentication, themes, API access, and plan limits.</p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-slate-400">Toggle between light and dark modes for all users.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>
        <p className="text-slate-400">Additional settings coming soon.</p>
      </div>
    </div>
  );
}

export default SettingsPage;
