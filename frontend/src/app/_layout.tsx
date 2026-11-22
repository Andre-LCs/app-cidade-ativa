import { Stack } from 'expo-router';
import { COLORS } from '../theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primaryBlue },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        statusBarStyle: 'light',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    />
  );
}
