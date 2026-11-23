import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

// Fundo das telas: no rodapé, a silhueta de um bairro (casas baixas, postes e árvores).
// O fundo liso vem da própria tela (cor `background` do tema); não usamos imagem de degradê
// porque, esticada, ela aparece cortada em alguns aparelhos Android.
// Use como primeiro filho de um container com `position: relative`.
export default function FundoHorizonte() {
  const { escuro } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={
          escuro
            ? require('../../../assets/images/fundo-horizonte-noite.png')
            : require('../../../assets/images/fundo-horizonte.png')
        }
        style={styles.horizonte}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  horizonte: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    aspectRatio: 1170 / 930,
  },
});
