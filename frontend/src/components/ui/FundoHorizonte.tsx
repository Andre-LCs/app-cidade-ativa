import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

// Fundo das telas: degradê suave e, no rodapé, a silhueta de um bairro (casas baixas,
// postes e árvores). Use como primeiro filho de um container com `position: relative`.
export default function FundoHorizonte() {
  const { escuro } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={escuro ? require('../../../assets/images/fundo-degrade-escuro.png') : require('../../../assets/images/fundo-degrade.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />
      <Image
        source={escuro ? require('../../../assets/images/fundo-horizonte-escuro.png') : require('../../../assets/images/fundo-horizonte.png')}
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
