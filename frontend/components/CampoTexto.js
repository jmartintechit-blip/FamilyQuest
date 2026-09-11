import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';

export default function CampoTexto({ etiqueta, ...propsInput }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);

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

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
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
}
