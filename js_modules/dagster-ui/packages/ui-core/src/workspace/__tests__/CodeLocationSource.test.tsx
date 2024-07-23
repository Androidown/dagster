import {render, screen} from '@testing-library/react';

import {CodeLocationSource} from '../CodeLocationSource';

describe('CodeLocationSource', () => {
  it('renders a GitHub project link', () => {
    const url = 'https://github.com/gh-namespace/foo-project/abcd1234';
    const metadata = [{key: 'url', value: url}];

    render(<CodeLocationSource metadata={metadata} />);

    expect(screen.getByLabelText('github')).toBeVisible();
    const link = screen.getByRole('link', {name: /gh-namespace/});

    expect(link).toBeVisible();
    expect(link.textContent).toBe('gh-namespace/foo-project');
    expect(link.getAttribute('href')).toBe(url);
  });

  it('renders a GitLab project link', () => {
    const url = 'https://gitlab.com/gl-namespace/bar-project/abcd1234';
    const metadata = [{key: 'url', value: url}];

    render(<CodeLocationSource metadata={metadata} />);

    expect(screen.getByLabelText('gitlab')).toBeVisible();
    const link = screen.getByRole('link', {name: /gl-namespace/});

    expect(link).toBeVisible();
    expect(link.textContent).toBe('gl-namespace/bar-project');
    expect(link.getAttribute('href')).toBe(url);
  });

  it('renders plaintext if the value is not a valid URL', () => {
    const url = 'nowhere';
    const metadata = [{key: 'url', value: url}];

    render(<CodeLocationSource metadata={metadata} />);

    // No links.
    expect(screen.queryByRole('link')).toBeNull();

    // Jest text.
    expect(screen.getByText('nowhere')).toBeVisible();
  });

  it('renders anchor link if the value is a URL but not GH/GL', () => {
    const url = 'https://google.com';
    const cleanedUrl = 'https://google.com/';
    const metadata = [{key: 'url', value: url}];

    render(<CodeLocationSource metadata={metadata} />);

    // No links.
    const link = screen.getByRole('link', {name: /google/});
    expect(link).toBeVisible();
    expect(link.getAttribute('href')).toBe(cleanedUrl);

    // Jest text.
    expect(screen.getByText(url)).toBeVisible();
  });
});
