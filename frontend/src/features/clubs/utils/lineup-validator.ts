import type { FormationType } from '../types';
import type { Player } from '@/features/players/types';

export function validateLineup(
  formation: FormationType,
  players: Player[],
): { valid: boolean; message?: string } {
  if (players.length !== 5) {
    return {
      valid: false,
      message: `Selecione exatamente 5 titulares (atualmente: ${players.length})`,
    };
  }

  const sickPlayer = players.find((p) => p.condition === 'DOENTE');
  if (sickPlayer) {
    return { valid: false, message: `${sickPlayer.name} está DOENTE e não pode ser escalado.` };
  }

  const gks = players.filter((p) => p.position === 'GOL').length;
  const defs = players.filter((p) => p.position === 'ZAG' || p.position === 'LAT').length;
  const mids = players.filter((p) => p.position === 'MEI').length;
  const fwds = players.filter((p) => p.position === 'ATA').length;

  if (gks !== 1) {
    return {
      valid: false,
      message: `A escalação deve conter exatamente 1 Goleiro (atualmente: ${gks})`,
    };
  }

  switch (formation) {
    case '3-1':
      if (defs !== 3 || fwds !== 1 || mids !== 0) {
        return {
          valid: false,
          message: `A formação 3-1 exige 1 GOL, 3 Defensores (ZAG/LAT) e 1 ATA. Atual: ${defs} DEF, ${mids} MEI, ${fwds} ATA.`,
        };
      }
      break;
    case '2-2':
      if (defs !== 2 || fwds !== 2 || mids !== 0) {
        return {
          valid: false,
          message: `A formação 2-2 exige 1 GOL, 2 Defensores (ZAG/LAT) e 2 ATA. Atual: ${defs} DEF, ${mids} MEI, ${fwds} ATA.`,
        };
      }
      break;
    case '2-1-1':
      if (defs !== 2 || mids !== 1 || fwds !== 1) {
        return {
          valid: false,
          message: `A formação 2-1-1 exige 1 GOL, 2 Defensores (ZAG/LAT), 1 MEI e 1 ATA. Atual: ${defs} DEF, ${mids} MEI, ${fwds} ATA.`,
        };
      }
      break;
    case '1-2-1':
      if (defs !== 1 || mids !== 2 || fwds !== 1) {
        return {
          valid: false,
          message: `A formação 1-2-1 exige 1 GOL, 1 Defensor (ZAG/LAT), 2 MEI e 1 ATA. Atual: ${defs} DEF, ${mids} MEI, ${fwds} ATA.`,
        };
      }
      break;
  }

  return { valid: true };
}
