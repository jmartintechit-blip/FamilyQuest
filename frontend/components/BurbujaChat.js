import { Text, View, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';

function colorPorNombre(nombre, coloresAvatar) {
  const indice = nombre.charCodeAt(0) % coloresAvatar.length;
  return coloresAvatar[indice];
}

function formatearHora(fechaHora) {
  // El backend guarda fecha_hora en UTC; hay que marcarlo con "Z" o Date lo
  // interpretaría como hora local (mismo bug ya corregido en notificaciones).
  const fecha = new Date(fechaHora.replace(' ', 'T') + 'Z');
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <Text style={[estilos.hora, esPropio && estilos.horaPropia]}>{formatearHora(mensaje.fecha_hora)}</Text>
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
    hora: {
      ...tipografia.chico,
      fontSize: 10,
      color: colores.textoSuave,
      alignSelf: 'flex-end',
      marginTop: 2,
    },
    horaPropia: {
      color: 'rgba(255,255,255,0.75)',
    },
  });
}
