import { StyleSheet, Text, View } from 'react-native';
import { colores, tipografia, espaciado } from '../theme';
import { useAuth } from '../context/AuthContext';
import BotonPrincipal from '../components/BotonPrincipal';
import Tarjeta from '../components/Tarjeta';

// De momento solo tiene cerrar sesión. Aquí es donde en la Fase 3 vamos a
// añadir modo oscuro/claro, tamaño de fuente, gestión de familia, etc.
export default function AjustesScreen() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ajustes</Text>

      <Tarjeta>
        <Text style={tipografia.subtitulo}>{usuario.nombre}</Text>
        <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.xs }]}>{usuario.email}</Text>
      </Tarjeta>

      <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: espaciado.md,
    paddingTop: 60,
  },
});
