import { render, screen } from '@testing-library/react';
import { Button } from '../Button'; // Adjust import path

describe('Button', () => {
  const defaultProps = {
    children: 'Click me',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('renders with default variant', () => {
    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('applies outline variant', () => {
    render(<Button {...defaultProps} variant="outline" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-input');
  });

  it('applies destructive variant', () => {
    render(<Button {...defaultProps} variant="destructive" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes', () => {
    render(<Button {...defaultProps} size="lg" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'text-lg');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button {...defaultProps} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button {...defaultProps} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards additional props', () => {
    render(<Button {...defaultProps} data-testid="custom-button" />);
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button {...defaultProps} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
