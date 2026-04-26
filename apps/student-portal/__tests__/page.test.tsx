import { render, screen } from '@testing-library/react';
import StudentHomePage from '../app/page';

describe('StudentHomePage', () => {
  it('renders student courses heading', () => {
    render(<StudentHomePage />);
    expect(screen.getByRole('heading', { name: /My Courses/i })).toBeInTheDocument();
  });

  it('renders build prompt', () => {
    render(<StudentHomePage />);
    expect(screen.getByText(/Build your student portal features here/i)).toBeInTheDocument();
  });
});
