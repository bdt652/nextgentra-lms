import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}));

describe('HomePage', () => {
  it('renders the homepage with default Next.js content', () => {
    render(<HomePage />);
    // Check for the default Next.js template text
    const titleElement = screen.getByText(
      /To get started, edit the page.tsx file/i
    );
    expect(titleElement).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    render(<HomePage />);
    // Page should render successfully
    expect(document.body).toBeDefined();
  });
});
