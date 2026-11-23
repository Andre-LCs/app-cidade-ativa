import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../theme';
import { AvisosProvider } from '../components/ui/Avisos';

// Os títulos ficam aqui (e não dentro de cada tela) para o cabeçalho já nascer com o texto certo.
function Navegacao() {
  const { colors: COLORS } = useTheme();
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primaryBlue },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          statusBarStyle: 'light',
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
        <Stack.Screen name="recuperar-senha" options={{ title: 'Recuperar senha' }} />
        <Stack.Screen name="minhas-ocorrencias" options={{ headerShown: false }} />
        <Stack.Screen name="mapa" options={{ title: 'Mapa de ocorrências' }} />
        <Stack.Screen name="nova-ocorrencia" options={{ title: 'Nova ocorrência' }} />
        <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AvisosProvider>
        <Navegacao />
      </AvisosProvider>
    </ThemeProvider>
  );
}
