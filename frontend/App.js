import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity } from 'react-native';

export default function App() {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [saltarFamilia, setSaltarFamilia] = useState(false);

  const URL_BASE = 'http://192.168.1.217:3000';

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

      setUsuario({ ...usuario, familia_id: familiaIdRecienCreada || true });
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

  if (usuario && (usuario.familia_id || saltarFamilia)) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>¡Hola, {usuario.nombre}!</Text>
        <Text>{usuario.familia_id ? 'Ya perteneces a una familia.' : 'Estás explorando sin familia por ahora.'}</Text>        <View style={{ marginTop: 20 }}>
          <Button title="Cerrar sesión" onPress={cerrarSesion} />
        </View>
      </View>
    );
  }

  if (usuario && !usuario.familia_id) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Casi listo, {usuario.nombre}</Text>
        <Text style={{ marginBottom: 20 }}>Crea una familia nueva o únete con un código</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de tu familia"
          value={nombreFamilia}
          onChangeText={setNombreFamilia}
        />
        <Button title="Crear familia" onPress={crearFamilia} />

        <Text style={{ marginVertical: 15 }}>— o —</Text>

        <TextInput
          style={styles.input}
          placeholder="Código de invitación"
          value={codigoInvitacion}
          onChangeText={setCodigoInvitacion}
          autoCapitalize="characters"
        />
        <Button title="Unirme a familia" onPress={unirseAFamilia} />
        <TouchableOpacity onPress={() => setSaltarFamilia(true)} style={{ marginTop: 20 }}>
          <Text style={styles.enlace}>Saltar por ahora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>App Familia</Text>

      {modoRegistro && (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {modoRegistro ? (
        <Button title="Crear cuenta" onPress={registrarse} />
      ) : (
        <Button title="Iniciar sesión" onPress={iniciarSesion} />
      )}

      <TouchableOpacity onPress={() => setModoRegistro(!modoRegistro)} style={{ marginTop: 15 }}>
        <Text style={styles.enlace}>
          {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  enlace: {
    color: '#007AFF',
  },
});