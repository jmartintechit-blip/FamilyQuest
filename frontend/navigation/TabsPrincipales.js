import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import InicioScreen from '../screens/InicioScreen';
import RankingScreen from '../screens/RankingScreen';
import ChatScreen from '../screens/ChatScreen';
import AjustesScreen from '../screens/AjustesScreen';

const Tab = createBottomTabNavigator();

const ICONOS = {
  Inicio: 'home',
  Ranking: 'trophy',
  Chat: 'chatbubbles',
  Ajustes: 'settings',
};

export default function TabsPrincipales() {
  const { colores, fuentes } = useTema();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: { backgroundColor: colores.superficie, borderTopColor: colores.borde, height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: fuentes.medio, fontSize: 12 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? ICONOS[route.name] : `${ICONOS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} />
    </Tab.Navigator>
  );
}
