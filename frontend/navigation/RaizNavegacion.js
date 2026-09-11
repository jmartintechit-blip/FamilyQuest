import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import AuthScreen from '../screens/AuthScreen';
import FamiliaSetupScreen from '../screens/FamiliaSetupScreen';
import SinFamiliaScreen from '../screens/SinFamiliaScreen';
import TabsPrincipales from './TabsPrincipales';

// Decide qué ve el usuario según en qué punto del flujo está: sesión
// cargando -> sin sesión -> sin familia -> app completa (con pestañas).
export default function RaizNavegacion() {
  const { usuario, cargandoSesion } = useAuth();
  const { colores } = useTema();
  const [saltarFamilia, setSaltarFamilia] = useState(false);

  if (cargandoSesion) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  if (!usuario) {
    return <AuthScreen />;
  }

  if (!usuario.familia_id) {
    return saltarFamilia ? <SinFamiliaScreen /> : <FamiliaSetupScreen onSaltar={() => setSaltarFamilia(true)} />;
  }

  return <TabsPrincipales />;
}
