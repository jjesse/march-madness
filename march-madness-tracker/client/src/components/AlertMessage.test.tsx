import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AlertMessage from './AlertMessage';

describe('AlertMessage', () => {
  it('renders nothing when no message is provided', () => {
    const { container } = render(<AlertMessage type="error" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the provided success message accessibly', () => {
    render(<AlertMessage type="success" message="Saved successfully" />);

    const alert = screen.getByRole('status');
    expect(alert).toHaveTextContent('Saved successfully');
    expect(alert).toHaveClass('alert', 'success');
  });
});
