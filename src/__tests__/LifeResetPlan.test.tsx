// src/__tests__/LifeResetPlan.test.tsx
import { render, screen } from '@testing-library/react';
import LifeResetPlan from '../components/LifeResetPlan';

describe('LifeResetPlan', () => {
  it('renders the main title', () => {
    render(<LifeResetPlan />);
    expect(screen.getByText('Life Reset Plan')).toBeInTheDocument();
  });

  it('displays core situation items', () => {
    render(<LifeResetPlan />);
    expect(screen.getByText(/Loneliness loops/)).toBeInTheDocument();
    expect(screen.getByText(/Financial stress/)).toBeInTheDocument();
  });

  it('shows the daily rule', () => {
    render(<LifeResetPlan />);
    expect(screen.getByText(/No day is valid without progress/)).toBeInTheDocument();
  });
});