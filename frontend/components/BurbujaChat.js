import { View, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';

function colorPorNombre(nombre, coloresAvatar) {
  const indice = nombre.charCodeAt(0) % coloresAvatar.length;
  return coloresAvatar[indice];
}

export default function BurbujaChat({ mensaje, esPropio }) {
  const { colores, tipografia, fuentes, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, fuentes, espaciado, radios);
  const coloresAvatar = [colores.primario, colores.acento, colores.dorado, colores.primarioOscuro];

  return (
    <View style={[estilos.fila, esPropio && estilos.filaPropia]}>
      {!esPropio && (
        <View style={[estilos.avatar, { backgroundColor: colorPorNombre(mensaje.autor, coloresAvatar) }]}>
          <Text style={estilos.iniciales}>{mensaje.autor.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={[estilos.burbuja, esPropio ? estilos.burbujaPropia : estilos.burbujaAjena]}>
        {!esPropio && <Text style={estilos.autor}>{mensaje.autor}</Text>}
        <Text style={[tipografia.cuerpo, esPropio && estilos.textoPropio]}>{mensaje.texto}</Text>
      </View>
    </View>
  );
}

function crearEstilos(colores, tipografia, fuentes, espaciado, radios) {
  return StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: espaciado.sm,
    },
    filaPropia: {
      justifyContent: 'flex-end',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: radios.completo,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: espaciado.xs,
    },
    iniciales: {
      ...tipografia.chico,
      color: colores.textoSobrePrimario,
    },
    burbuja: {
      maxWidth: '75%',
      borderRadius: radios.md,
      paddingHorizontal: espaciado.sm,
      paddingVertical: espaciado.xs,
    },
    burbujaAjena: {
      backgroundColor: colores.superficieSuave,
    },
    burbujaPropia: {
      backgroundColor: colores.primario,
    },
    autor: {
      ...tipografia.chico,
      fontFamily: fuentes.negrita,
      marginBottom: 2,
    },
    textoPropio: {
      color: colores.textoSobrePrimario,
    },
  });
}
