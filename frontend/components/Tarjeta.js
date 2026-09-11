import { View, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';

// Contenedor visual reutilizable: agrupa contenido con fondo, borde
// redondeado y una sombra suave para separarlo del fondo de la app.
export default function Tarjeta({ children, style }) {
  const { colores, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, espaciado, radios);
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

function crearEstilos(colores, espaciado, radios) {
  return StyleSheet.create({
    tarjeta: {
      width: '100%',
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.md,
      marginBottom: espaciado.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  });
}
