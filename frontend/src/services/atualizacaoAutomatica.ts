// Mantém uma tela atualizada sem precisar recarregar na mão:
// - a cada 20 s (com a tela em foco e o app/aba visível) pergunta ao servidor se algo mudou;
// - ao voltar para o app (ou para a aba do navegador) verifica na hora.
// Só recarrega os dados quando a "versão" devolvida por GET /ocorrencias/versao mudou.
import { useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiRequest } from './api';
import * as tokenStorage from './tokenStorage';

const INTERVALO_MS = 20000;

function telaVisivel() {
  if (Platform.OS === 'web') return document.visibilityState === 'visible';
  return AppState.currentState === 'active';
}

export function useAtualizacaoAutomatica(recarregar: () => Promise<void> | void) {
  const versaoRef = useRef<string | null>(null);
  const ocupadoRef = useRef(false);
  const recarregarRef = useRef(recarregar);
  recarregarRef.current = recarregar;

  const verificar = useCallback(async () => {
    if (ocupadoRef.current || !telaVisivel()) return;
    ocupadoRef.current = true;
    try {
      const token = await tokenStorage.getItem('token');
      const { versao } = await apiRequest('/ocorrencias/versao', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // A primeira consulta só marca o ponto de partida; depois, qualquer mudança recarrega.
      if (versaoRef.current !== null && versao !== versaoRef.current) {
        await recarregarRef.current();
      }
      versaoRef.current = versao;
    } catch {
      // sem conexão ou servidor acordando: tenta de novo no próximo ciclo
    } finally {
      ocupadoRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      versaoRef.current = null;
      verificar();

      const timer = setInterval(verificar, INTERVALO_MS);
      const assinatura = AppState.addEventListener('change', (estado) => {
        if (estado === 'active') verificar();
      });

      const aoVoltar = () => verificar();
      if (Platform.OS === 'web') {
        document.addEventListener('visibilitychange', aoVoltar);
        window.addEventListener('focus', aoVoltar);
      }

      return () => {
        clearInterval(timer);
        assinatura.remove();
        if (Platform.OS === 'web') {
          document.removeEventListener('visibilitychange', aoVoltar);
          window.removeEventListener('focus', aoVoltar);
        }
      };
    }, [verificar])
  );
}
