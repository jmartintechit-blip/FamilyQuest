import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import BotonPrincipal from '../components/BotonPrincipal';
import CampoTexto from '../components/CampoTexto';

export default function AuthScreen() {
  const { guardarSesion } = useAuth();
  const { colores, tipografia, espaciado } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

      await guardarSesion(datos, datos.token);
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
        { text: 'OK', onPress: () => setModoRegistro(false) },
      ]);
      setNombre('');
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={tipografia.tituloGrande}>FamilyQuest</Text>
      <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg }]}>
        Tareas del hogar, en equipo 🌿
      </Text>

      {modoRegistro && <CampoTexto placeholder="Nombre" value={nombre} onChangeText={setNombre} />}

      <CampoTexto placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />

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

function crearEstilos(colores, tipografia, espaciado) {
  return StyleSheet.create({
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
  });
}
