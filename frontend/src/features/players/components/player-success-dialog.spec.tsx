import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSuccessDialog } from './player-success-dialog';
import type { Player } from '../types';

const mockCreatedPlayer: Player = {
  id: 42,
  name: 'Endrick Felipe',
  position: 'ATA',
  agility: 88,
  age: 18,
  condition: 'APTO',
  base_value: 50.0,
  market_value: 75.0,
  pace: 89,
  shooting: 84,
  passing: 72,
  dribbling: 86,
  defending: 38,
  physical: 82,
  potential: 94,
  overall: 82,
  club_id: null,
};

describe('PlayerSuccessDialog Component (Figma J07)', () => {
  it('renders success header, player card summary and action buttons', () => {
    const onOpenChange = vi.fn();
    const onRegisterAnother = vi.fn();

    render(
      <PlayerSuccessDialog
        player={mockCreatedPlayer}
        open={true}
        onOpenChange={onOpenChange}
        onRegisterAnother={onRegisterAnother}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /Jogador Cadastrado com Sucesso!/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Endrick Felipe')).toBeInTheDocument();
    expect(screen.getByText('ATA')).toBeInTheDocument();
    expect(screen.getByText('Apto')).toBeInTheDocument();

    // Stats
    expect(screen.getByText('82')).toBeInTheDocument(); // Overall
    expect(screen.getByText('88')).toBeInTheDocument(); // Agility
    expect(screen.getByText('18')).toBeInTheDocument(); // Age

    // Buttons
    const registerAnotherBtn = screen.getByRole('button', { name: /Cadastrar Outro/i });
    const viewListBtn = screen.getByRole('button', { name: /Ver na Listagem/i });

    expect(registerAnotherBtn).toBeInTheDocument();
    expect(viewListBtn).toBeInTheDocument();

    fireEvent.click(registerAnotherBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onRegisterAnother).toHaveBeenCalled();

    fireEvent.click(viewListBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
