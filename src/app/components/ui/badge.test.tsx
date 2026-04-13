import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render the badge with children correctly', () => {
    render(<Badge>New Feature</Badge>);
    
    const badge = screen.getByText(/new feature/i);
    expect(badge).toBeInTheDocument();
    
    // Check default variant classes (bg-primary)
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('should apply the correct secondary variant classes', () => {
    render(<Badge variant="secondary">Beta</Badge>);
    
    const badge = screen.getByText(/beta/i);
    expect(badge).toHaveClass('bg-secondary');
    expect(badge).toHaveClass('text-secondary-foreground');
  });

  it('should apply the correct destructive variant classes', () => {
    render(<Badge variant="destructive">Error</Badge>);
    
    const badge = screen.getByText(/error/i);
    expect(badge).toHaveClass('bg-destructive');
    expect(badge).toHaveClass('text-white');
  });

  it('should apply the correct outline variant classes', () => {
    render(<Badge variant="outline">Draft</Badge>);
    
    const badge = screen.getByText(/draft/i);
    expect(badge).toHaveClass('text-foreground');
    // Outline usually doesn't have a background color by default, just border
  });

  it('should append custom class names', () => {
    render(<Badge className="mt-4 shadow-lg">Custom</Badge>);
    
    const badge = screen.getByText(/custom/i);
    // Custom classes
    expect(badge).toHaveClass('mt-4');
    expect(badge).toHaveClass('shadow-lg');
    // Default base classes should still be there
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('rounded-md');
  });

  it('should render as a child component when asChild is true', () => {
    render(
      <Badge asChild variant="outline">
        <a href="/pricing">Pro Plan</a>
      </Badge>
    );
    
    // It should render an anchor tag with the badge styles
    const link = screen.getByRole('link', { name: /pro plan/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/pricing');
    
    // Check if it has the badge outline styles
    expect(link).toHaveClass('text-foreground');
    expect(link).toHaveClass('inline-flex');
  });
});