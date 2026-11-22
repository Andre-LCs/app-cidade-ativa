import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

// Ícone que alterna entre tema claro e escuro (lua no claro, sol no escuro).
export default function BotaoTema({ style, tamanho = 28 }: { style?: StyleProp<ViewStyle>; tamanho?: number }) {
  const { escuro, alternar, colors } = useTheme();
  return (
    <TouchableOpacity
      style={style}
      activeOpacity={0.7}
      onPress={alternar}
      accessibilityLabel={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
    >
      <Ionicons name={escuro ? 'sunny-outline' : 'moon-outline'} size={tamanho} color={colors.white} />
    </TouchableOpacity>
  );
}
