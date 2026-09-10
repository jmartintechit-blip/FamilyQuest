import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colores, tipografia, espaciado, radios } from '../theme';

export default function CampoTexto({ etiqueta, ...propsInput }) {
  return (
    <View style={estilos.contenedor}>
      {etiqueta && <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <TextInput
        style={estilos.input}
        placeholderTextColor={colores.textoSuave}
        {...propsInput}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: '100%',
    marginBottom: espaciado.md,
  },
  etiqueta: {
    ...tipografia.chico,
    marginBottom: espaciado.xs,
  },
  input: {
    width: '100%',
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.md,
    ...tipografia.cuerpo,
  },
});
