import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

  async function iniciarSesion() {
    try {
      const respuesta = await fetch('http://192.168.1.217:3000/login', {
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
      console.log(error);
    }
  }

  function cerrarSesion() {
    setUsuario(null);
    setToken(null);
    setEmail('');
    setPassword('');
  }

  if (usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>¡Hola, {usuario.nombre}!</Text>
        <Text>Has iniciado sesión correctamente.</Text>
        <View style={{ marginTop: 20 }}>
          <Button title="Cerrar sesión" onPress={cerrarSesion} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>App Familia</Text>

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

      <Button title="Iniciar sesión" onPress={iniciarSesion} />
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
});