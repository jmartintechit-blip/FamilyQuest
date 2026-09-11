import 'react-native-gesture-handler';
import { useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from './context/AuthContext';
import { TemaProvider, useTema } from './context/TemaContext';
import RaizNavegacion from './navigation/RaizNavegacion';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsCargadas] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsCargadas) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TemaProvider>
        <ContenidoApp />
      </TemaProvider>
    </GestureHandlerRootView>
  );
}

// Separado de App() porque useTema() solo funciona dentro de <TemaProvider>.
function ContenidoApp() {
  const { colores, modoActivo } = useTema();

  const alTerminarLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  const temaNavegacion = {
    dark: modoActivo === 'oscuro',
    colors: {
      primary: colores.primario,
      background: colores.fondo,
      card: colores.superficie,
      text: colores.texto,
      border: colores.borde,
      notification: colores.acento,
    },
    // React Navigation espera esta forma exacta desde la v6 (la usan sus
    // componentes internos, como las pestañas) — sin esto, rompe en tiempo real.
    fonts: {
      regular: { fontFamily: 'Nunito_400Regular', fontWeight: '400' },
      medium: { fontFamily: 'Nunito_600SemiBold', fontWeight: '500' },
      bold: { fontFamily: 'Nunito_700Bold', fontWeight: '700' },
      heavy: { fontFamily: 'Nunito_800ExtraBold', fontWeight: '800' },
    },
  };

  return (
    <View style={{ flex: 1 }} onLayout={alTerminarLayout}>
      <StatusBar style={modoActivo === 'oscuro' ? 'light' : 'dark'} />
      <AuthProvider>
        <NavigationContainer theme={temaNavegacion}>
          <RaizNavegacion />
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}
