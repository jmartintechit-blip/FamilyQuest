import 'react-native-gesture-handler';
import { useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from './context/AuthContext';
import RaizNavegacion from './navigation/RaizNavegacion';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsCargadas] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const alTerminarLayout = useCallback(async () => {
    if (fontsCargadas) {
      await SplashScreen.hideAsync();
    }
  }, [fontsCargadas]);

  if (!fontsCargadas) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={alTerminarLayout}>
        <AuthProvider>
          <NavigationContainer>
            <RaizNavegacion />
          </NavigationContainer>
        </AuthProvider>
      </View>
    </GestureHandlerRootView>
  );
}
