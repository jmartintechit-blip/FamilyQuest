import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Context de React: una forma de compartir datos (aquí, la sesión del
// usuario) entre pantallas sin tener que pasarlos a mano de componente en
// componente. Cualquier pantalla llama a useAuth() y tiene acceso directo.
const AuthContext = createContext(null);

const CLAVE_STORAGE = '@app_familia_sesion';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Al abrir la app, miramos si había una sesión guardada del uso anterior.
  useEffect(() => {
    async function restaurarSesion() {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_STORAGE);
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
    await AsyncStorage.setItem(CLAVE_STORAGE, JSON.stringify({ usuario: usuarioNuevo, token: tokenNuevo }));
  }

  // Para cuando cambia algo del usuario ya logueado (p. ej. se une a una
  // familia, o cambia su nombre desde Ajustes) sin tener que iniciar sesión otra vez.
  async function actualizarUsuario(cambios) {
    setUsuario((actual) => {
      const nuevo = { ...actual, ...cambios };
      AsyncStorage.setItem(CLAVE_STORAGE, JSON.stringify({ usuario: nuevo, token }));
      return nuevo;
    });
  }

  async function cerrarSesion() {
    setUsuario(null);
    setToken(null);
    await AsyncStorage.removeItem(CLAVE_STORAGE);
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
