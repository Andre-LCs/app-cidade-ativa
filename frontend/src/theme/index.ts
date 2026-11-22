// Tema central do app (direção visual A: azul institucional + verde de ação).
//
// Todas as telas importam as cores daqui. Para um futuro tema escuro, basta criar uma
// segunda paleta com as mesmas chaves e escolher qual usar.
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const COLORS = {
  // marca
  primaryBlue: '#1F3F77',
  primaryBlueDark: '#14305F',
  primaryBlueLight: '#2A5298',
  primaryGreen: '#1F7A33', // verde de ação e de texto (contraste adequado sobre branco)
  logoGreen: '#32A041', // verde da logo, só para preenchimentos grandes

  // superfícies
  background: '#F3F6FB',
  cardBackground: '#FFFFFF',
  inputBackground: '#F1F5F9',
  border: '#E2E8F0',
  borderCard: '#F1F5F9',
  borderFocused: '#1F3F77',

  // texto
  textPrimary: '#0F172A',
  textSecondary: '#5B6B82',
  placeholder: '#94A3B8',
  white: '#FFFFFF',
  onBlueMuted: '#D6E2F5',
  onBlueTint: 'rgba(255,255,255,0.14)',

  // feedback
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  errorBorder: '#FECACA',
  successBackground: '#F0FDF4',
  successBorder: '#BBF7D0',
};

type IconeNome = ComponentProps<typeof Ionicons>['name'];

// Status da ocorrência: texto, cor do texto e fundo do selo.
export const STATUS: Record<string, { label: string; cor: string; fundo: string }> = {
  ABERTA: { label: 'Aberta', cor: '#1F3F77', fundo: '#E8EEF8' },
  EM_VALIDACAO: { label: 'Em validação', cor: '#92400E', fundo: '#FEF3C7' },
  VALIDADA: { label: 'Validada', cor: '#166534', fundo: '#DCFCE7' },
  ENVIADA_PREFEITURA: { label: 'Enviada ao órgão responsável', cor: '#1F3F77', fundo: '#E8EEF8' },
  EM_ATENDIMENTO: { label: 'Em atendimento', cor: '#92400E', fundo: '#FEF3C7' },
  RESOLVIDA: { label: 'Resolvida', cor: '#166534', fundo: '#DCFCE7' },
  EXPIRADA: { label: 'Expirada', cor: '#5B6B82', fundo: '#F1F5F9' },
  DUPLICADA: { label: 'Duplicada', cor: '#5B6B82', fundo: '#F1F5F9' },
};

export type CategoriaVisual = { icone: IconeNome; cor: string; fundo: string };

function semAcento(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Ícone e cores de cada categoria (mesmas famílias de cor dos pinos do mapa).
export function categoriaVisual(nome: string): CategoriaVisual {
  const n = semAcento(nome || '');
  if (n.includes('buraco')) return { icone: 'warning-outline', cor: '#C2410C', fundo: '#FFEDD5' };
  if (n.includes('ilumin')) return { icone: 'bulb-outline', cor: '#B45309', fundo: '#FEF3C7' };
  if (n.includes('lixo') || n.includes('entulho')) return { icone: 'trash-outline', cor: '#0F766E', fundo: '#CCFBF1' };
  if (n.includes('calcada')) return { icone: 'footsteps-outline', cor: '#0B63A8', fundo: '#DDEEFB' };
  if (n.includes('veiculo')) return { icone: 'car-outline', cor: '#5B3FB0', fundo: '#EDE9FE' };
  return { icone: 'location-outline', cor: '#1F3F77', fundo: '#E8EEF8' };
}

export function primeiroNome(nome?: string | null) {
  return (nome ?? '').trim().split(/\s+/)[0] ?? '';
}

export function iniciais(nome?: string | null) {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const a = partes[0][0];
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase();
}
