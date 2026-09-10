import { StyleSheet, Text, View } from 'react-native';
import { colores, tipografia, espaciado } from '../theme';
import { useAuth } from '../context/AuthContext';
import BotonPrincipal from '../components/BotonPrincipal';

// Se muestra cuando el usuario decidió "saltar por ahora" en vez de crear o
// unirse a una familia. Sin familia_id no hay tareas, ranking ni chat que
// mostrar, así que de momento solo puede cerrar sesión y volver a intentarlo.
export default function SinFamiliaScreen() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={tipografia.tituloGrande}>¡Hola, {usuario.nombre}!</Text>
      <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg, textAlign: 'center' }]}>
        Aún no tienes familia. Únete a una para ver tareas y puntos.
      </Text>
      <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
});
