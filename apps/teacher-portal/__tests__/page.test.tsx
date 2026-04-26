import { render, screen } from '@testing-library/react';
import TeacherHomePage from '../app/page';

describe('TeacherHomePage', () => {
  it('renders teacher dashboard heading', () => {
    render(<TeacherHomePage />);
    expect(screen.getByRole('heading', { name: /Teacher Dashboard/i })).toBeInTheDocument();
  });

  it('renders build prompt', () => {
    render(<TeacherHomePage />);
    expect(screen.getByText(/Build your teacher portal features here/i)).toBeInTheDocument();
  });
});
