import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '@components/agent/builder/Sidebar';

const renderSidebar = () => render(<Sidebar />);

describe('Agent builder sidebar', () => {
  it('lists the available tool categories', () => {
    renderSidebar();

    expect(screen.getByText('Tool Palette')).toBeInTheDocument();
    expect(screen.getByText('Triggers')).toBeInTheDocument();
    expect(screen.getByText('Payment Actions')).toBeInTheDocument();
    expect(screen.getByText('Logic')).toBeInTheDocument();
    expect(screen.getByText('Outputs')).toBeInTheDocument();
  });

  it('marks palette items as draggable tools', async () => {
    const user = userEvent.setup();
    renderSidebar();

    const manualTrigger = screen.getByText('Manual Trigger');
    expect(manualTrigger).toHaveAttribute('draggable', 'true');

    await user.hover(manualTrigger);
    expect(screen.getByText('💡 Quick Tip')).toBeInTheDocument();
  });
});
