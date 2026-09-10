import { View, Text, StyleSheet } from 'react-native';
import { colores, tipografia, fuentes, espaciado, radios } from '../theme';

const COLORES_AVATAR = [colores.primario, colores.acento, colores.dorado, colores.primarioOscuro];

function colorPorNombre(nombre) {
  const indice = nombre.charCodeAt(0) % COLORES_AVATAR.length;
  return COLORES_AVATAR[indice];
}

export default function BurbujaChat({ mensaje, esPropio }) {
  return (
    <View style={[estilos.fila, esPropio && estilos.filaPropia]}>
      {!esPropio && (
        <View style={[estilos.avatar, { backgroundColor: colorPorNombre(mensaje.autor) }]}>
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

const estilos = StyleSheet.create({
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
