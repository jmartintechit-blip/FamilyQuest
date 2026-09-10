import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colores, tipografia, espaciado, radios } from '../theme';

// variante: 'primario' (botón sólido, acción principal) o 'secundario' (borde, acción secundaria)
export default function BotonPrincipal({ titulo, onPress, variante = 'primario', disabled = false }) {
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

const estilos = StyleSheet.create({
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
