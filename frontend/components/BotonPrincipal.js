import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';

// variante: 'primario' (botón sólido, acción principal) o 'secundario' (borde, acción secundaria)
export default function BotonPrincipal({ titulo, onPress, variante = 'primario', disabled = false }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const esSecundario = variante === 'secundario';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        estilos.boton,
        esSecundario ? estilos.botonSecundario : estilos.botonPrimario,
        disabled && estilos.botonDeshabilitado,
      ]}
    >
      <Text style={[estilos.texto, esSecundario && estilos.textoSecundario]}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    boton: {
      width: '100%',
      paddingVertical: espaciado.md,
      borderRadius: radios.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: espaciado.sm,
    },
    botonPrimario: {
      backgroundColor: colores.primario,
    },
    botonSecundario: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colores.primario,
    },
    botonDeshabilitado: {
      opacity: 0.5,
    },
    texto: {
      ...tipografia.subtitulo,
      color: colores.textoSobrePrimario,
    },
    textoSecundario: {
      color: colores.primario,
    },
  });
}
