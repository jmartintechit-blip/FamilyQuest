import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import BotonPrincipal from '../components/BotonPrincipal';
import CampoTexto from '../components/CampoTexto';

export default function FamiliaSetupScreen({ onSaltar }) {
  const { usuario, token, actualizarUsuario } = useAuth();
  const { colores, tipografia, espaciado } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado);
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState('');

  async function unirseConCodigo(codigo) {
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

      await actualizarUsuario({ familia_id: datos.familia_id });
      Alert.alert('¡Listo!', datos.mensaje);
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

      await unirseConCodigo(datos.codigo_invitacion);
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

  return (
    <View style={styles.container}>
      <Text style={tipografia.tituloGrande}>Casi listo, {usuario.nombre}</Text>
      <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.sm, marginBottom: espaciado.lg, textAlign: 'center' }]}>
        Crea una familia nueva o únete con un código
      </Text>

      <CampoTexto placeholder="Nombre de tu familia" value={nombreFamilia} onChangeText={setNombreFamilia} />
      <BotonPrincipal titulo="Crear familia" onPress={crearFamilia} />

      <Text style={[tipografia.cuerpoSuave, { marginVertical: espaciado.md }]}>— o —</Text>

      <CampoTexto
        placeholder="Código de invitación"
        value={codigoInvitacion}
        onChangeText={setCodigoInvitacion}
        autoCapitalize="characters"
      />
      <BotonPrincipal titulo="Unirme a familia" variante="secundario" onPress={unirseAFamilia} />

      <TouchableOpacity onPress={onSaltar} style={{ marginTop: espaciado.lg }}>
        <Text style={styles.enlace}>Saltar por ahora</Text>
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
