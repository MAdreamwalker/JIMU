import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';

describe('App', () => {
  it('renders the desktop shell navigation', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '椤圭洰' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '浠诲姟' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '璁剧疆' })).toBeInTheDocument();
  });
});
