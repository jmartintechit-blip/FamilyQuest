import { useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';
import { registrarPushToken, programarRecordatorioMascota } from '../utils/notificaciones';
import InicioScreen from '../screens/InicioScreen';
import RankingScreen from '../screens/RankingScreen';
import TareasScreen from '../screens/TareasScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import AjustesScreen from '../screens/AjustesScreen';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Inicio: 'home',
  Ranking: 'trophy',
  Chat: 'chatbubbles',
  Notificaciones: 'notifications',
  Ajustes: 'settings',
};

// Botón central "+" para añadir tareas: más grande, elevado sobre la barra,
// para que destaque como la acción rápida más habitual. Recibe (y aplica) el
// resto de props que React Navigation pasa a cualquier tabBarButton -sobre
// todo `style`, que trae el `flex` que reparte el ancho por igual entre las
// 6 pestañas- para que ocupe la misma columna que sus vecinas y no se vea
// descentrado.
function BotonTareasCentral({ onPress, colores, style }) {
  const estilos = crearEstilosBotonCentral(colores);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[style, estilos.columna]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Añadir tarea"
    >
      <View style={estilos.circulo}>
        <Ionicons name="add" size={30} color={colores.textoSobrePrimario} />
      </View>
    </TouchableOpacity>
  );
}

function crearEstilosBotonCentral(colores) {
  return StyleSheet.create({
    columna: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    circulo: {
      top: -18,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colores.primario,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 4,
    },
  });
}

export default function TabsPrincipales() {
  const { colores, fuentes } = useTema();
  const { token } = useAuth();

  // Se ejecuta una vez al entrar a la app con familia: pide permiso, intenta
  // registrar el push token (silenciosamente si falla) y programa el
  // recordatorio recurrente de la mascota.
  useEffect(() => {
    registrarPushToken(token);
    programarRecordatorioMascota();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: { backgroundColor: colores.superficie, borderTopColor: colores.borde, height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontFamily: fuentes.medio, fontSize: 10 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? ICONOS[route.name] : `${ICONOS[route.name]}-outline`} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen
        name="Tareas"
        component={TareasScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <BotonTareasCentral {...props} colores={colores} />,
        }}
      />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={{ tabBarLabel: 'Avisos' }} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} />
    </Tab.Navigator>
  );
}
