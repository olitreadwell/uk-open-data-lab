import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from './SiteHeader';

expect.extend(toHaveNoViolations);

describe('SiteHeader', () => {
  it('links home from the wordmark', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'uk-open-data-lab' })).toHaveAttribute('href', '/');
  });

  it('links to the about page', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SiteHeader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
