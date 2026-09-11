import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { URL_BASE } from '../constants/config';
import { TAMANOS_FUENTE } from '../theme';
import BotonPrincipal from '../components/BotonPrincipal';
import Tarjeta from '../components/Tarjeta';

const OPCIONES_MODO = [
  { valor: 'sistema', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
];

function SelectorSegmentado({ opciones, valorActual, onCambiar, colores, tipografia, espaciado, radios }) {
  const estilos = crearEstilosSelector(colores, tipografia, espaciado, radios);
  return (
    <View style={estilos.fila}>
      {opciones.map((opcion) => {
        const activo = opcion.valor === valorActual;
        return (
          <TouchableOpacity
            key={opcion.valor}
            onPress={() => onCambiar(opcion.valor)}
            style={[estilos.segmento, activo && estilos.segmentoActivo]}
          >
            <Text style={activo ? estilos.textoActivo : estilos.texto}>{opcion.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function crearEstilosSelector(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fila: {
      flexDirection: 'row',
      backgroundColor: colores.superficieSuave,
      borderRadius: radios.md,
      padding: 4,
    },
    segmento: {
      flex: 1,
      paddingVertical: espaciado.sm,
      alignItems: 'center',
      borderRadius: radios.sm,
    },
    segmentoActivo: {
      backgroundColor: colores.primario,
    },
    texto: {
      ...tipografia.chico,
      color: colores.textoSuave,
    },
    textoActivo: {
      ...tipografia.chico,
      color: colores.textoSobrePrimario,
    },
  });
}

export default function AjustesScreen() {
  const { usuario, token, cerrarSesion, actualizarUsuario } = useAuth();
  const { colores, tipografia, espaciado, radios, modoPreferido, tamanoFuente, cambiarModo, cambiarTamanoFuente } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado, radios);
  const [familia, setFamilia] = useState(null);
  const [miembros, setMiembros] = useState([]);

  const opcionesTamano = Object.keys(TAMANOS_FUENTE).map((clave) => ({
    valor: clave,
    etiqueta: TAMANOS_FUENTE[clave].etiqueta,
  }));

  async function cargarFamilia() {
    try {
      const [respuestaFamilia, respuestaMiembros] = await Promise.all([
        fetch(`${URL_BASE}/familias/${usuario.familia_id}`),
        fetch(`${URL_BASE}/familias/${usuario.familia_id}/usuarios`),
      ]);
      setFamilia(await respuestaFamilia.json());
      setMiembros(await respuestaMiembros.json());
    } catch (error) {
      console.log('Error cargando datos de familia', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarFamilia();
    }, [usuario.familia_id])
  );

  function confirmarSalirDeFamilia() {
    Alert.alert(
      '¿Salir de la familia?',
      'Perderás tus puntos actuales y dejarás de ver sus tareas, ranking y chat. Podrás unirte de nuevo con un código de invitación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: salirDeFamilia },
      ]
    );
  }

  async function salirDeFamilia() {
    try {
      const respuesta = await fetch(`${URL_BASE}/usuarios/${usuario.id}/salir-familia`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        Alert.alert('Error', datos.error);
        return;
      }

      await actualizarUsuario({ familia_id: null });
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo salir de la familia');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ajustes</Text>

      <Tarjeta>
        <Text style={tipografia.subtitulo}>{usuario.nombre}</Text>
        <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.xs }]}>{usuario.email}</Text>
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Apariencia</Text>
        <SelectorSegmentado
          opciones={OPCIONES_MODO}
          valorActual={modoPreferido}
          onCambiar={cambiarModo}
          colores={colores}
          tipografia={tipografia}
          espaciado={espaciado}
          radios={radios}
        />
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Tamaño de letra</Text>
        <SelectorSegmentado
          opciones={opcionesTamano}
          valorActual={tamanoFuente}
          onCambiar={cambiarTamanoFuente}
          colores={colores}
          tipografia={tipografia}
          espaciado={espaciado}
          radios={radios}
        />
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Tu familia</Text>

        {familia && (
          <>
            <Text style={tipografia.cuerpo}>{familia.nombre}</Text>
            <View style={styles.filaCodigo}>
              <Text style={tipografia.cuerpoSuave}>Código de invitación</Text>
              <Text style={styles.codigo}>{familia.codigo_invitacion}</Text>
            </View>
          </>
        )}

        <Text style={[tipografia.chico, { marginTop: espaciado.md, marginBottom: espaciado.xs }]}>
          Miembros ({miembros.length})
        </Text>
        {miembros.map((miembro) => (
          <View key={miembro.id} style={styles.filaMiembro}>
            <Text style={tipografia.cuerpo}>
              {miembro.nombre}
              {miembro.id === usuario.id ? ' (tú)' : ''}
            </Text>
            <Text style={styles.puntosMiembro}>{miembro.puntos_totales} pts</Text>
          </View>
        ))}
      </Tarjeta>

      <BotonPrincipal titulo="Salir de la familia" variante="secundario" onPress={confirmarSalirDeFamilia} />
      <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </ScrollView>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    filaCodigo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: espaciado.sm,
      paddingTop: espaciado.sm,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
    },
    codigo: {
      ...tipografia.subtitulo,
      color: colores.primarioOscuro,
      letterSpacing: 1,
    },
    filaMiembro: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: espaciado.xs,
    },
    puntosMiembro: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
  });
}
