import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import AboutPage from './page';

expect.extend(toHaveNoViolations);

describe('AboutPage', () => {
  it('explains what the site is and where the data comes from', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'About uk-open-data-lab' })).toBeVisible();
    expect(screen.getByText(/River Thames leads with 55 stations/)).toBeVisible();
    expect(screen.getByText(/agency flood-monitoring API/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'uk-open-data-connectors' })).toHaveAttribute(
      'href',
      'https://github.com/olitreadwell/uk-open-data-connectors',
    );
    expect(screen.getByRole('link', { name: 'awesome-open-uk-data' })).toHaveAttribute(
      'href',
      'https://github.com/olitreadwell/awesome-open-uk-data',
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/olitreadwell/uk-open-data-lab',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AboutPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
