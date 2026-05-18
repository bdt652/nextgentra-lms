import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));

describe('HomePage', () => {
  it('renders the homepage with LMS branding', () => {
    render(<HomePage />);
    // Check for the LMS title
    const titleElement = screen.getByText(/NextGenTra LMS/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders login and register buttons', () => {
    render(<HomePage />);
    expect(screen.getByText(/Đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByText(/Đăng ký/i)).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    render(<HomePage />);
    // Page should render successfully
    expect(document.body).toBeDefined();
  });
});
