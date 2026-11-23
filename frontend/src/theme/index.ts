// Tema central do app (direção visual A: azul institucional + verde de ação).
//
// LIGHT e DARK têm as mesmas chaves. As telas pegam a paleta ativa com `useTheme()`
// (ver ThemeProvider.tsx) e montam os estilos com ela.
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const LIGHT = {
  // marca
  primaryBlue: '#1F3F77',
  primaryBlueDark: '#14305F',
  primaryBlueLight: '#2A5298',
  primaryGreen: '#1F7A33', // verde de ação e de texto (contraste adequado sobre branco)
  logoGreen: '#32A041', // verde da logo, só para preenchimentos grandes
  textAccent: '#1F3F77', // azul para títulos e links sobre superfícies
  textGreen: '#1F7A33', // verde para links e textos de ação

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

export type Paleta = typeof LIGHT;

export const DARK: Paleta = {
  primaryBlue: '#254B8F',
  primaryBlueDark: '#1B3A6E',
  primaryBlueLight: '#4A78CC',
  primaryGreen: '#25883A',
  logoGreen: '#32A041',
  textAccent: '#8DB4F2',
  textGreen: '#4CC26A',

  background: '#0B1220',
  cardBackground: '#131C2E',
  inputBackground: '#1A2438',
  border: '#263248',
  borderCard: '#1E2A40',
  borderFocused: '#6F9BE6',

  textPrimary: '#E6EDF7',
  textSecondary: '#9AA8BD',
  placeholder: '#6B7A92',
  white: '#FFFFFF',
  onBlueMuted: '#D6E2F5',
  onBlueTint: 'rgba(255,255,255,0.14)',

  error: '#F87171',
  errorBackground: '#3A1517',
  errorBorder: '#7F1D1D',
  successBackground: '#0F2A1A',
  successBorder: '#14532D',
};

// compatibilidade: paleta clara como padrão
export const COLORS = LIGHT;

type IconeNome = ComponentProps<typeof Ionicons>['name'];

// Status da ocorrência: texto, cor do texto e fundo do selo.
export const STATUS: Record<string, { label: string; cor: string; fundo: string; icone: IconeNome }> = {
  ABERTA: { label: 'Aberta', cor: '#1F3F77', fundo: '#E8EEF8', icone: 'radio-button-on-outline' },
  EM_VALIDACAO: { label: 'Em validação', cor: '#92400E', fundo: '#FEF3C7', icone: 'people-outline' },
  VALIDADA: { label: 'Validada', cor: '#166534', fundo: '#DCFCE7', icone: 'shield-checkmark-outline' },
  ENVIADA_PREFEITURA: { label: 'Enviada ao órgão', cor: '#1F3F77', fundo: '#E8EEF8', icone: 'paper-plane-outline' },
  EM_ATENDIMENTO: { label: 'Em atendimento', cor: '#92400E', fundo: '#FEF3C7', icone: 'construct-outline' },
  RESOLVIDA: { label: 'Resolvida', cor: '#166534', fundo: '#DCFCE7', icone: 'checkmark-circle-outline' },
  EXPIRADA: { label: 'Expirada', cor: '#5B6B82', fundo: '#F1F5F9', icone: 'time-outline' },
  DUPLICADA: { label: 'Duplicada', cor: '#5B6B82', fundo: '#F1F5F9', icone: 'copy-outline' },
  CANCELADA: { label: 'Cancelada', cor: '#5B6B82', fundo: '#F1F5F9', icone: 'close-circle-outline' },
};

// mistura a cor com branco (f = 0..1) para ter texto legível sobre fundo escuro
function clarear(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * f));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// versão do par cor/fundo para o tema escuro: texto clareado, fundo = cor original translúcida
export function paraEscuro<T extends { cor: string; fundo: string }>(v: T, escuro: boolean): T {
  if (!escuro) return v;
  return { ...v, cor: clarear(v.cor, 0.45), fundo: v.cor + '33' };
}

export type CategoriaVisual = { icone: IconeNome; cor: string; fundo: string };

function semAcento(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Ícone e cores de cada categoria (mesmas famílias de cor dos pinos do mapa).
export function categoriaVisual(nome: string): CategoriaVisual {
  const n = semAcento(nome || '');
  if (n.includes('terra') || n.includes('erosao')) return { icone: 'trail-sign-outline', cor: '#8A4B1E', fundo: '#FBE8D5' };
  if (n.includes('mato') || n.includes('baldio')) return { icone: 'leaf-outline', cor: '#3F6B1F', fundo: '#E4F2D6' };
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

export { ThemeProvider, useTheme } from './ThemeProvider';
