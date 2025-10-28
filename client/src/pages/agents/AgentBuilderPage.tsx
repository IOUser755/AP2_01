import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

function AgentBuilderPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <Helmet>
        <title>{isEditing ? 'Edit agent' : 'Create agent'} | AgentPay Hub</title>
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold">{isEditing ? 'Edit agent' : 'Build a new agent'}</h1>
        <p className="text-slate-400">
          Configure workflows, triggers, constraints, and notifications for your AI payment agent.
        </p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-slate-400">Visual builder coming soon.</p>
      </div>
    </div>
  );
}

export default AgentBuilderPage;
