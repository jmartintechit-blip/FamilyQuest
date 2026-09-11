import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTema } from '../../context/TemaContext';
import { ESPECIES } from './especies';
import { COSMETICOS } from './cosmeticos';

const NOMBRES_SLOT = { sombrero: 'Sombrero', gafas: 'Gafas', cuello: 'Cuello' };

function FilaOpcion({ emoji, nombre, desbloqueado, activo, costo, alcanza, onElegir, onDesbloquear, onQuitar }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);

  return (
    <View style={[estilos.fila, activo && estilos.filaActiva]}>
      <Text style={estilos.emoji}>{emoji}</Text>
      <Text style={[tipografia.cuerpo, { flex: 1 }]}>{nombre}</Text>

      {desbloqueado ? (
        <TouchableOpacity
          onPress={() => (activo ? onQuitar?.() : onElegir())}
          style={[estilos.boton, activo ? estilos.botonActivo : estilos.botonSecundario]}
        >
          <Text style={activo ? estilos.textoBotonActivo : estilos.textoBotonSecundario}>
            {activo ? (onQuitar ? 'Quitar' : 'En uso') : 'Elegir'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => alcanza && onDesbloquear()}
          disabled={!alcanza}
          style={[estilos.boton, alcanza ? estilos.botonSecundario : estilos.botonDeshabilitado]}
        >
          <Text style={alcanza ? estilos.textoBotonSecundario : estilos.textoBotonDeshabilitado}>🔒 {costo}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// especiesDesbloqueadas: string[]; costosEspecies: { [especie]: { costo } } (de GET /especies-mascota)
// cosmeticosDesbloqueados: string[]; cosmeticosEquipados: { sombrero, gafas, cuello }
// costosCosmeticos: { [id]: { slot, costo } } (de GET /cosmeticos-mascota)
export default function SelectorMascota({
  visible,
  onClose,
  especieActiva,
  especiesDesbloqueadas,
  costosEspecies,
  cosmeticosDesbloqueados,
  cosmeticosEquipados,
  costosCosmeticos,
  monedas,
  onSeleccionar,
  onDesbloquear,
  onEquiparCosmetico,
  onDesbloquearCosmetico,
}) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const [pestana, setPestana] = useState('mascota');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <Text style={[tipografia.cuerpoSuave, { marginBottom: espaciado.md }]}>🪙 {monedas} monedas familiares</Text>

          <View style={estilos.pestanas}>
            <TouchableOpacity onPress={() => setPestana('mascota')} style={[estilos.pestana, pestana === 'mascota' && estilos.pestanaActiva]}>
              <Text style={pestana === 'mascota' ? estilos.textoPestanaActiva : estilos.textoPestana}>Mascota</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPestana('complementos')} style={[estilos.pestana, pestana === 'complementos' && estilos.pestanaActiva]}>
              <Text style={pestana === 'complementos' ? estilos.textoPestanaActiva : estilos.textoPestana}>Complementos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }}>
            {pestana === 'mascota'
              ? Object.keys(ESPECIES).map((clave) => {
                  const info = ESPECIES[clave];
                  const costo = costosEspecies?.[clave]?.costo ?? 0;
                  return (
                    <FilaOpcion
                      key={clave}
                      emoji={info.emoji}
                      nombre={info.nombre}
                      desbloqueado={especiesDesbloqueadas.includes(clave)}
                      activo={especieActiva === clave}
                      costo={costo}
                      alcanza={monedas >= costo}
                      onElegir={() => onSeleccionar(clave)}
                      onDesbloquear={() => onDesbloquear(clave)}
                    />
                  );
                })
              : ['sombrero', 'gafas', 'cuello'].map((slot) => (
                  <View key={slot}>
                    <Text style={estilos.tituloSlot}>{NOMBRES_SLOT[slot]}</Text>
                    {Object.keys(COSMETICOS)
                      .filter((clave) => COSMETICOS[clave].slot === slot)
                      .map((clave) => {
                        const info = COSMETICOS[clave];
                        const costo = costosCosmeticos?.[clave]?.costo ?? 0;
                        return (
                          <FilaOpcion
                            key={clave}
                            emoji={info.emoji}
                            nombre={info.nombre}
                            desbloqueado={cosmeticosDesbloqueados.includes(clave)}
                            activo={cosmeticosEquipados?.[slot] === clave}
                            costo={costo}
                            alcanza={monedas >= costo}
                            onElegir={() => onEquiparCosmetico(slot, clave)}
                            onDesbloquear={() => onDesbloquearCosmetico(clave)}
                            onQuitar={() => onEquiparCosmetico(slot, null)}
                          />
                        );
                      })}
                  </View>
                ))}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={estilos.cerrar}>
            <Text style={{ color: colores.primario }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.lg,
    },
    tarjeta: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.lg,
    },
    pestanas: {
      flexDirection: 'row',
      backgroundColor: colores.superficieSuave,
      borderRadius: radios.md,
      padding: 4,
      marginBottom: espaciado.sm,
    },
    pestana: {
      flex: 1,
      paddingVertical: espaciado.xs,
      alignItems: 'center',
      borderRadius: radios.sm,
    },
    pestanaActiva: {
      backgroundColor: colores.primario,
    },
    textoPestana: {
      ...tipografia.chico,
      color: colores.textoSuave,
    },
    textoPestanaActiva: {
      ...tipografia.chico,
      color: colores.textoSobrePrimario,
    },
    tituloSlot: {
      ...tipografia.chico,
      color: colores.textoSuave,
      marginTop: espaciado.sm,
      marginBottom: espaciado.xs,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
      gap: espaciado.sm,
    },
    filaActiva: {
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
    },
    emoji: {
      fontSize: 26,
    },
    boton: {
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.sm,
      borderRadius: radios.sm,
    },
    botonActivo: {
      backgroundColor: colores.primario,
    },
    botonSecundario: {
      borderWidth: 1.5,
      borderColor: colores.primario,
    },
    botonDeshabilitado: {
      borderWidth: 1.5,
      borderColor: colores.borde,
    },
    textoBotonActivo: {
      color: colores.textoSobrePrimario,
    },
    textoBotonSecundario: {
      color: colores.primario,
    },
    textoBotonDeshabilitado: {
      color: colores.textoSuave,
    },
    cerrar: {
      marginTop: espaciado.md,
      alignItems: 'center',
    },
  });
}
