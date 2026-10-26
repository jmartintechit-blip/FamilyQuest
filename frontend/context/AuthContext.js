import { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Context de React: una forma de compartir datos (aquí, la sesión del
// usuario) entre pantallas sin tener que pasarlos a mano de componente en
// componente. Cualquier pantalla llama a useAuth() y tiene acceso directo.
const AuthContext = createContext(null);

// SecureStore solo admite letras, números, "." "-" y "_" en la clave, así que la clave
// nueva no lleva la "@" de la antigua (que sigue usándose en AsyncStorage y en web).
const CLAVE_ANTIGUA = '@app_familia_sesion';
const CLAVE_SEGURA = 'app_familia_sesion';

// El token da acceso a la cuenta: en móvil se guarda cifrado (Keychain / Keystore).
// La web no tiene almacén seguro, así que ahí se queda en AsyncStorage (localStorage).
const almacen =
  Platform.OS === 'web'
    ? {
        leer: () => AsyncStorage.getItem(CLAVE_ANTIGUA),
        guardar: (valor) => AsyncStorage.setItem(CLAVE_ANTIGUA, valor),
        borrar: () => AsyncStorage.removeItem(CLAVE_ANTIGUA),
      }
    : {
        leer: () => SecureStore.getItemAsync(CLAVE_SEGURA),
        guardar: (valor) => SecureStore.setItemAsync(CLAVE_SEGURA, valor),
        borrar: () => SecureStore.deleteItemAsync(CLAVE_SEGURA),
      };

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Al abrir la app, miramos si había una sesión guardada del uso anterior.
  useEffect(() => {
    async function restaurarSesion() {
      try {
        let guardado = await almacen.leer();
        if (!guardado && Platform.OS !== 'web') {
          // Sesión de una versión anterior: se pasa al almacén cifrado y se borra la copia en claro.
          guardado = await AsyncStorage.getItem(CLAVE_ANTIGUA);
          if (guardado) await almacen.guardar(guardado);
          await AsyncStorage.removeItem(CLAVE_ANTIGUA);
        }
        if (guardado) {
          const { usuario: usuarioGuardado, token: tokenGuardado } = JSON.parse(guardado);
          setUsuario(usuarioGuardado);
          setToken(tokenGuardado);
        }
      } catch (error) {
        console.log('Error restaurando sesión', error);
      } finally {
        setCargandoSesion(false);
      }
    }
    restaurarSesion();
  }, []);

  async function guardarSesion(usuarioNuevo, tokenNuevo) {
    setUsuario(usuarioNuevo);
    setToken(tokenNuevo);
    await almacen.guardar(JSON.stringify({ usuario: usuarioNuevo, token: tokenNuevo }));
  }

  // Para cuando cambia algo del usuario ya logueado (p. ej. se une a una
  // familia, o cambia su nombre desde Ajustes) sin tener que iniciar sesión otra vez.
  async function actualizarUsuario(cambios) {
    setUsuario((actual) => {
      const nuevo = { ...actual, ...cambios };
      almacen.guardar(JSON.stringify({ usuario: nuevo, token }));
      return nuevo;
    });
  }

  async function cerrarSesion() {
    setUsuario(null);
    setToken(null);
    await almacen.borrar();
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargandoSesion, guardarSesion, actualizarUsuario, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
