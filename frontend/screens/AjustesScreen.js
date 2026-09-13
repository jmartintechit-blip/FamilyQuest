import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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

const AYUDA = [
  {
    icono: 'paw-outline',
    titulo: 'La mascota',
    texto: 'Su salud sube cuando alguien de la familia completa tareas positivas, y baja con las negativas. Cuidadla entre todos.',
  },
  {
    icono: 'logo-bitcoin',
    titulo: 'Monedas',
    texto: 'Se ganan igual que los puntos (suben y bajan con las tareas) y son compartidas por toda la familia. Sirven para desbloquear especies y complementos nuevos para la mascota.',
  },
  {
    icono: 'trophy-outline',
    titulo: 'Ranking',
    texto: 'Se reinicia cada semana para que siempre haya una competición fresca. Las monedas y la mascota no se ven afectadas por el reinicio.',
  },
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
      const cabecera = { headers: { 'Authorization': `Bearer ${token}` } };
      const [respuestaFamilia, respuestaMiembros] = await Promise.all([
        fetch(`${URL_BASE}/familias/${usuario.familia_id}`, cabecera),
        fetch(`${URL_BASE}/familias/${usuario.familia_id}/usuarios`, cabecera),
      ]);
      if (respuestaFamilia.ok) setFamilia(await respuestaFamilia.json());
      if (respuestaMiembros.ok) setMiembros(await respuestaMiembros.json());
    } catch (error) {
      console.log('Error cargando datos de familia', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarFamilia();
    }, [usuario.familia_id])
  );

  async function copiarCodigo() {
    await Clipboard.setStringAsync(familia.codigo_invitacion);
    Alert.alert('Copiado', 'El código de invitación se copió al portapapeles');
  }

  async function compartirCodigo() {
    try {
      await Share.share({
        message: `Únete a nuestra familia en FamilyQuest con el código ${familia.codigo_invitacion}`,
      });
    } catch (error) {
      console.log('Error compartiendo el código', error);
    }
  }

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
              <View>
                <Text style={tipografia.cuerpoSuave}>Código de invitación</Text>
                <Text style={styles.codigo}>{familia.codigo_invitacion}</Text>
              </View>
              <View style={styles.filaBotonesCodigo}>
                <TouchableOpacity onPress={copiarCodigo} style={styles.botonIcono}>
                  <Ionicons name="copy-outline" size={20} color={colores.primario} />
                </TouchableOpacity>
                <TouchableOpacity onPress={compartirCodigo} style={styles.botonIcono}>
                  <Ionicons name="share-social-outline" size={20} color={colores.primario} />
                </TouchableOpacity>
              </View>
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

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Cómo funciona</Text>
        {AYUDA.map((item, indice) => (
          <View key={item.titulo} style={[styles.filaAyuda, indice === AYUDA.length - 1 && { borderBottomWidth: 0 }]}>
            <Ionicons name={item.icono} size={22} color={colores.primario} style={styles.iconoAyuda} />
            <View style={{ flex: 1 }}>
              <Text style={tipografia.cuerpo}>{item.titulo}</Text>
              <Text style={[tipografia.chico, { marginTop: 2 }]}>{item.texto}</Text>
            </View>
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
    filaBotonesCodigo: {
      flexDirection: 'row',
      gap: espaciado.sm,
    },
    botonIcono: {
      padding: espaciado.xs,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
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
    filaAyuda: {
      flexDirection: 'row',
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
      gap: espaciado.sm,
    },
    iconoAyuda: {
      marginTop: 2,
    },
  });
}
