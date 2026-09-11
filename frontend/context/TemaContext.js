import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paletaClara, paletaOscura, crearTipografia, espaciado, radios, fuentes, TAMANOS_FUENTE } from '../theme';

const TemaContext = createContext(null);

const CLAVE_STORAGE = '@app_familia_tema';

export function TemaProvider({ children }) {
  const esquemaSistema = useColorScheme(); // 'light' | 'dark' | null
  // 'sistema' sigue el modo del teléfono; 'claro'/'oscuro' lo fuerzan.
  const [modoPreferido, setModoPreferido] = useState('sistema');
  const [tamanoFuente, setTamanoFuente] = useState('normal');
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    async function restaurar() {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_STORAGE);
        if (guardado) {
          const { modoPreferido: modo, tamanoFuente: tamano } = JSON.parse(guardado);
          if (modo) setModoPreferido(modo);
          if (tamano) setTamanoFuente(tamano);
        }
      } catch (error) {
        console.log('Error restaurando tema', error);
      } finally {
        setCargado(true);
      }
    }
    restaurar();
  }, []);

  function guardar(cambios) {
    const nuevo = { modoPreferido, tamanoFuente, ...cambios };
    AsyncStorage.setItem(CLAVE_STORAGE, JSON.stringify(nuevo));
  }

  function cambiarModo(modo) {
    setModoPreferido(modo);
    guardar({ modoPreferido: modo });
  }

  function cambiarTamanoFuente(tamano) {
    setTamanoFuente(tamano);
    guardar({ tamanoFuente: tamano });
  }

  const modoActivo = modoPreferido === 'sistema' ? (esquemaSistema === 'dark' ? 'oscuro' : 'claro') : modoPreferido;
  const colores = modoActivo === 'oscuro' ? paletaOscura : paletaClara;
  const escala = TAMANOS_FUENTE[tamanoFuente]?.escala ?? 1;

  // Recalcular tipografía solo cuando cambian sus ingredientes, no en cada render.
  const tipografia = useMemo(() => crearTipografia(colores, escala), [modoActivo, escala]);

  const valor = {
    colores,
    tipografia,
    espaciado,
    radios,
    fuentes,
    modoActivo,
    modoPreferido,
    tamanoFuente,
    cambiarModo,
    cambiarTamanoFuente,
  };

  if (!cargado) return null;

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
