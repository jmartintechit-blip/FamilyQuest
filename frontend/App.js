import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { io } from 'socket.io-client';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { colores, tipografia, espaciado, radios } from './theme';
import BotonPrincipal from './components/BotonPrincipal';
import CampoTexto from './components/CampoTexto';
import Tarjeta from './components/Tarjeta';
import MascotaHero from './components/mascota/MascotaHero';
import BannerEvento from './components/BannerEvento';
import TareaItem from './components/TareaItem';
import RankingLista from './components/RankingLista';
import BurbujaChat from './components/BurbujaChat';

SplashScreen.preventAutoHideAsync();

// Eventos de ejemplo para el "modo caos". El backend todavía no genera estos
// eventos por su cuenta: esto es solo para poder mostrar y probar la parte
// visual (el banner) hasta que exista esa lógica en el servidor.
const EVENTOS_DEMO = [
  { tipo: 'hora_dorada', mensaje: '✨ Hora dorada: los puntos valen el doble durante 2 horas' },
  { tipo: 'reto_familiar', mensaje: '🎯 Reto familiar: completad 3 tareas hoy y ganáis un bonus' },
];

export default function App() {
  const [fontsCargadas] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [saltarFamilia, setSaltarFamilia] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [socket, setSocket] = useState(null);
  const [mostrarChat, setMostrarChat] = useState(false);
  const [saludMascota, setSaludMascota] = useState(100);
  const [puntosFlotantes, setPuntosFlotantes] = useState([]);
  const [eventoActivo, setEventoActivo] = useState(null);

  const URL_BASE = 'http://192.168.1.217:3000';

  const alTerminarLayout = useCallback(async () => {
    if (fontsCargadas) {
      await SplashScreen.hideAsync();
    }
  }, [fontsCargadas]);

  useEffect(() => {
    if (usuario && typeof usuario.familia_id === 'number') {
      const nuevoSocket = io(URL_BASE);
      nuevoSocket.emit('unirse_familia', usuario.familia_id);

      nuevoSocket.on('mensaje_nuevo', (mensaje) => {
        setMensajes((mensajesActuales) => [...mensajesActuales, mensaje]);
      });

      setSocket(nuevoSocket);
      cargarMensajes();

      return () => {
        nuevoSocket.disconnect();
      };
    }
  }, [usuario]);

  async function cargarTareas() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/tareas`);
      const datos = await respuesta.json();
      setTareas(datos);
    } catch (error) {
      console.log('Error cargando tareas', error);
    }
  }

  async function cargarFamilia() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}`);
      const datos = await respuesta.json();
      setSaludMascota(datos.salud_mascota);
    } catch (error) {
      console.log('Error cargando familia', error);
    }
  }

  async function cargarMensajes() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/mensajes`);
      const datos = await respuesta.json();
      setMensajes(datos);
    } catch (error) {
      console.log('Error cargando mensajes', error);
    }
  }

  async function enviarMensaje() {
    if (!textoMensaje.trim()) return;

    try {
      await fetch(`${URL_BASE}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          familia_id: usuario.familia_id,
          usuario_id: usuario.id,
          texto: textoMensaje,
        }),
      });

      setTextoMensaje('');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo enviar el mensaje');
    }
  }

  async function cargarRanking() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/ranking`);
      const datos = await respuesta.json();
      setRanking(datos);
    } catch (error) {
      console.log('Error cargando ranking', error);
    }
  }

  function mostrarPuntoFlotante(tarea) {
    const id = Date.now();
    const texto = `${tarea.puntos_valor > 0 ? '+' : ''}${tarea.puntos_valor} puntos`;
    const color = tarea.puntos_valor > 0 ? colores.primarioOscuro : colores.error;

    setPuntosFlotantes((actuales) => [...actuales, { id, texto, color }]);
    setTimeout(() => {
      setPuntosFlotantes((actuales) => actuales.filter((p) => p.id !== id));
    }, 1300);
  }

  async function marcarTareaHecha(tareaId) {
    const tarea = tareas.find((t) => t.id === tareaId);

    try {
      const respuesta = await fetch(`${URL_BASE}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ usuario_id: usuario.id, tarea_id: tareaId }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      if (tarea) mostrarPuntoFlotante(tarea);
      cargarRanking();
      cargarFamilia();
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  // Demo del "modo caos": activa un evento de ejemplo unos segundos.
  // Sustituir por la lógica real en cuanto el backend genere estos eventos.
  function simularEventoEspecial() {
    const evento = EVENTOS_DEMO[Math.floor(Math.random() * EVENTOS_DEMO.length)];
    setEventoActivo(evento);
    setTimeout(() => setEventoActivo(null), 8000);
  }

  useEffect(() => {
    if (usuario && usuario.familia_id && typeof usuario.familia_id === 'number') {
      cargarTareas();
      cargarRanking();
      cargarFamilia();
    }
  }, [usuario]);

  async function iniciarSesion() {
    try {
      const respuesta = await fetch(`${URL_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      setUsuario(datos);
      setToken(datos.token);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  async function registrarse() {
    if (!nombre || !email || !password) {
      Alert.alert('Faltan datos', 'Rellena nombre, email y contraseña');
      return;
    }

    try {
      const respuesta = await fetch(`${URL_BASE}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      Alert.alert('¡Cuenta creada!', 'Ahora puedes iniciar sesión', [
        { text: 'OK', onPress: () => setModoRegistro(false) }
      ]);
      setNombre('');
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  async function crearFamilia() {
    if (!nombreFamilia) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para tu familia');
      return;
    }

    try {
      const respuesta = await fetch(`${URL_BASE}/familias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: nombreFamilia }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      await unirseConCodigo(datos.codigo_invitacion, datos.id);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  async function unirseAFamilia() {
    if (!codigoInvitacion) {
      Alert.alert('Falta el código', 'Escribe el código de invitación');
      return;
    }
    await unirseConCodigo(codigoInvitacion);
  }

  async function unirseConCodigo(codigo, familiaIdRecienCreada) {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/unirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ usuario_id: usuario.id, codigo_invitacion: codigo }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      setUsuario({ ...usuario, familia_id: datos.familia_id });
      Alert.alert('¡Listo!', datos.mensaje);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  function cerrarSesion() {
    setUsuario(null);
    setToken(null);
    setEmail('');
    setPassword('');
    setNombre('');
  }

  if (!fontsCargadas) {
    return null;
  }

  if (usuario && (usuario.familia_id || saltarFamilia)) {
    if (!usuario.familia_id) {
      return (
        <View style={styles.container} onLayout={alTerminarLayout}>
          <Text style={tipografia.tituloGrande}>¡Hola, {usuario.nombre}!</Text>
          <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg, textAlign: 'center' }]}>
            Aún no tienes familia. Únete a una para ver tareas y puntos.
          </Text>
          <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.containerLista}
        contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}
        onLayout={alTerminarLayout}
      >
        <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.sm }]}>¡Hola, {usuario.nombre}!</Text>

        <BannerEvento evento={eventoActivo} />

        <MascotaHero salud={saludMascota} puntosFlotantes={puntosFlotantes} />

        <Tarjeta>
          <Text style={styles.seccion}>Tus tareas</Text>
          {tareas.map((tarea) => (
            <TareaItem key={tarea.id} tarea={tarea} onMarcar={marcarTareaHecha} />
          ))}
        </Tarjeta>

        <Tarjeta>
          <Text style={styles.seccion}>Ranking</Text>
          <RankingLista ranking={ranking} />
        </Tarjeta>

        <Tarjeta>
          <TouchableOpacity onPress={() => setMostrarChat(!mostrarChat)}>
            <Text style={styles.seccion}>{mostrarChat ? 'Ocultar chat ▲' : 'Ver chat ▼'}</Text>
          </TouchableOpacity>

          {mostrarChat && (
            <View>
              <View style={styles.cajaChat}>
                {mensajes.map((mensaje) => (
                  <BurbujaChat
                    key={mensaje.id}
                    mensaje={mensaje}
                    esPropio={mensaje.usuario_id === usuario.id}
                  />
                ))}
              </View>

              <View style={styles.filaInputChat}>
                <View style={{ flex: 1 }}>
                  <CampoTexto
                    placeholder="Escribe un mensaje..."
                    value={textoMensaje}
                    onChangeText={setTextoMensaje}
                  />
                </View>
                <TouchableOpacity onPress={enviarMensaje} style={styles.botonEnviar}>
                  <Text style={styles.textoBotonEnviar}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Tarjeta>

        <TouchableOpacity onPress={simularEventoEspecial} style={{ marginBottom: espaciado.md }}>
          <Text style={styles.enlaceDemo}>✨ Simular evento especial (demo)</Text>
        </TouchableOpacity>

        <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
      </ScrollView>
    );
  }

  if (usuario && !usuario.familia_id) {
    return (
      <View style={styles.container} onLayout={alTerminarLayout}>
        <Text style={tipografia.tituloGrande}>Casi listo, {usuario.nombre}</Text>
        <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg, textAlign: 'center' }]}>
          Crea una familia nueva o únete con un código
        </Text>

        <CampoTexto
          placeholder="Nombre de tu familia"
          value={nombreFamilia}
          onChangeText={setNombreFamilia}
        />
        <BotonPrincipal titulo="Crear familia" onPress={crearFamilia} />

        <Text style={[tipografia.cuerpoSuave, { marginVertical: espaciado.md }]}>— o —</Text>

        <CampoTexto
          placeholder="Código de invitación"
          value={codigoInvitacion}
          onChangeText={setCodigoInvitacion}
          autoCapitalize="characters"
        />
        <BotonPrincipal titulo="Unirme a familia" variante="secundario" onPress={unirseAFamilia} />

        <TouchableOpacity onPress={() => setSaltarFamilia(true)} style={{ marginTop: espaciado.lg }}>
          <Text style={styles.enlace}>Saltar por ahora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={alTerminarLayout}>
      <Text style={tipografia.tituloGrande}>App Familia</Text>
      <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg }]}>
        Tareas del hogar, en equipo 🌿
      </Text>

      {modoRegistro && (
        <CampoTexto
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
        />
      )}

      <CampoTexto
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <CampoTexto
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {modoRegistro ? (
        <BotonPrincipal titulo="Crear cuenta" onPress={registrarse} />
      ) : (
        <BotonPrincipal titulo="Iniciar sesión" onPress={iniciarSesion} />
      )}

      <TouchableOpacity onPress={() => setModoRegistro(!modoRegistro)} style={{ marginTop: espaciado.md }}>
        <Text style={styles.enlace}>
          {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  containerLista: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  cajaChat: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.md,
    padding: espaciado.sm,
    height: 150,
    marginTop: espaciado.sm,
  },
  filaInputChat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: espaciado.sm,
    gap: espaciado.sm,
  },
  botonEnviar: {
    backgroundColor: colores.primario,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.md,
  },
  textoBotonEnviar: {
    ...tipografia.cuerpo,
    color: colores.textoSobrePrimario,
  },
  seccion: {
    ...tipografia.subtitulo,
    marginBottom: espaciado.sm,
  },
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  enlace: {
    ...tipografia.cuerpo,
    color: colores.primario,
  },
  enlaceDemo: {
    ...tipografia.chico,
    color: colores.doradoOscuro,
    textAlign: 'center',
    marginBottom: espaciado.sm,
  },
});
