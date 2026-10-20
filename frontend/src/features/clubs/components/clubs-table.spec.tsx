import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClubsTable } from './clubs-table';
import type { ClubSummary } from '../types';

const mockClubs: ClubSummary[] = [
  {
    id: 1,
    name: 'Tubarões EC',
    acronym: 'TUB',
    cash: 300.0,
    squad_value: 0.0,
    net_worth: 300.0,
  },
  {
    id: 2,
    name: 'Épsilon EC',
    acronym: 'EPS',
    cash: 215.47,
    squad_value: 80.5,
    net_worth: 295.97,
  },
];

function renderComponent(props: Partial<Parameters<typeof ClubsTable>[0]> = {}) {
  const defaultProps = {
    clubs: mockClubs,
    sort: 'net_worth_desc',
    onSortChange: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <MemoryRouter>
        <ClubsTable {...defaultProps} />
      </MemoryRouter>,
    ),
    props: defaultProps,
  };
}

describe('ClubsTable Component (Figma node 9-35767)', () => {
  it('renders all 6 official columns from the Figma prototype', () => {
    renderComponent();

    expect(screen.getByRole('columnheader', { name: /^Clube$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Sigla$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Caixa$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Valor do elenco$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Patrimônio$/i })).toBeInTheDocument();
  });

  it('renders club counter and 20-club limit badge correctly', () => {
    renderComponent();

    expect(screen.getByText('2 clubes')).toBeInTheDocument();
    expect(screen.getByText('2 de 20')).toBeInTheDocument();
  });

  it('renders clubs data with correct formatting without R$ prefix', () => {
    renderComponent();

    // Club 1
    expect(screen.getByText('Tubarões EC')).toBeInTheDocument();
    expect(screen.getAllByText('TUB').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('300,00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0,00')).toBeInTheDocument();

    // Club 2
    expect(screen.getByText('Épsilon EC')).toBeInTheDocument();
    expect(screen.getAllByText('EPS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('215,47')).toBeInTheDocument();
    expect(screen.getByText('80,50')).toBeInTheDocument();
    expect(screen.getByText('295,97')).toBeInTheDocument();

    // Navigation links
    const detailLinks = screen.getAllByRole('link', { name: /Ver clube/i });
    expect(detailLinks.length).toBe(2);
    expect(detailLinks[0]).toHaveAttribute('href', '/clubs/1');
    expect(detailLinks[1]).toHaveAttribute('href', '/clubs/2');
  });

  it('renders footer note explaining the sorting rules', () => {
    renderComponent();

    expect(
      screen.getByText(
        'Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor, com empate desfeito pelo nome.',
      ),
    ).toBeInTheDocument();
  });

  it('renders empty state when no clubs are passed', () => {
    renderComponent({ clubs: [] });

    expect(screen.getByText('0 clubes')).toBeInTheDocument();
    expect(screen.getByText('0 de 20')).toBeInTheDocument();
    expect(screen.getByText('Nenhum clube encontrado')).toBeInTheDocument();
  });
});
