import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as tokenStorage from '../services/tokenStorage';
import { DARK, LIGHT, type Paleta } from './index';

export type ModoTema = 'claro' | 'escuro';

type Valor = {
  colors: Paleta;
  escuro: boolean;
  modo: ModoTema;
  setModo: (m: ModoTema) => void;
  alternar: () => void;
};

const Contexto = createContext<Valor>({ colors: LIGHT, escuro: false, modo: 'claro', setModo: () => {}, alternar: () => {} });

const CHAVE = 'tema';

// Tema do app: começa sempre no claro; o usuário alterna pelo ícone e a escolha fica salva no aparelho.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [modo, setModoEstado] = useState<ModoTema>('claro');

  useEffect(() => {
    tokenStorage.getItem(CHAVE).then((v) => {
      if (v === 'escuro') setModoEstado('escuro');
    }).catch(() => {});
  }, []);

  const setModo = useCallback((m: ModoTema) => {
    setModoEstado(m);
    tokenStorage.setItem(CHAVE, m).catch(() => {});
  }, []);

  const alternar = useCallback(() => setModo(modo === 'escuro' ? 'claro' : 'escuro'), [modo, setModo]);
  const escuro = modo === 'escuro';
  const valor = useMemo(() => ({ colors: escuro ? DARK : LIGHT, escuro, modo, setModo, alternar }), [escuro, modo, setModo, alternar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTheme() {
  return useContext(Contexto);
}
