import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button Component', () => {
  it('should render the button with children correctly', () => {
    render(<Button>Click Me</Button>);
    
    // The button should exist and have the text 'Click Me'
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    
    // Simulate user clicking the button
    fireEvent.click(button);
    
    // Ensure the function passed to onClick was called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply the correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: /delete/i });
    
    // Check if the Tailwind class for destructive variant is applied
    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('text-white');
  });

  it('should be disabled when disabled prop is passed', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    
    expect(button).toBeDisabled();
    
    // Clicking a disabled button should not trigger the onClick handler
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render as a child component when asChild is true', () => {
    // asChild prop uses Radix UI's Slot to pass button props to the child element
    render(
      <Button asChild>
        <a href="/home">Go Home</a>
      </Button>
    );
    
    // Should render an <a> tag, not a <button> tag
    const link = screen.getByRole('link', { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/home');
    
    // The default button classes should still be applied to the <a> tag
    expect(link).toHaveClass('inline-flex');
    expect(link).toHaveClass('bg-primary');
  });
});
