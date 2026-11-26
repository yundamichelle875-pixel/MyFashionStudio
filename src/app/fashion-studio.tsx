import { useState } from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import { useFashion } from '../context/FashionContext';
import {
  CATALOG,
  HAIR_COLORS,
  HAIR_STYLES,
  MAKEUP_STYLES,
} from '../data/catalog';

type Mode = 'photo' | '3d';

export default function FashionStudioScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const {
    avatarPhoto,
    generatedAvatar,
    selectedItems,
    setSelectedItems,
    hairStyle,
    setHairStyle,
    hairColor,
    setHairColor,
    makeupStyle,
    setMakeupStyle,
    selectedAccessories,
    setSelectedAccessories,
    savedLooks,
    saveCurrentLook,
    isHydrated,
    storageError,
  } = useFashion();

  const [mode, setMode] = useState<Mode>('photo');
  const [lookName, setLookName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const previewUri = generatedAvatar ?? avatarPhoto;
  const accessoryItems = CATALOG.filter(
    (item) => item.category === 'Accesorios' || item.category === 'Bolsos'
  );

  const removeItem = (id: string) => {
    setSelectedItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const toggleAccessory = (id: string) => {
    setSelectedAccessories((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSaveLook = () => {
    const saved = saveCurrentLook(lookName);
    setLookName('');
    setSaveMessage(`"${saved.name}" guardado en este dispositivo. ♡`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable>
          <Text style={styles.back}>← Volver al inicio</Text>
        </Pressable>
      </Link>

      <Text style={styles.eyebrow}>MY FASHION STUDIO ✦</Text>
      <Text style={styles.title}>Fashion Studio</Text>
      <Text style={styles.description}>
        Aquí se reúnen tu avatar, tus prendas y tus elecciones de belleza.
        Los cambios se comparten con Mi armario mientras la app esté abierta.
      </Text>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeButton, mode === 'photo' && styles.modeActive]}
          onPress={() => setMode('photo')}
        >
          <Text
            style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}
          >
            📷 Modo fotográfico (2D)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.modeButton, mode === '3d' && styles.modeActive]}
          onPress={() => setMode('3d')}
        >
          <Text
            style={[styles.modeText, mode === '3d' && styles.modeTextActive]}
          >
            🧊 Modo 3D · pendiente
          </Text>
        </Pressable>
      </View>

      {mode === '3d' ? (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>El modo 3D aún no está implementado</Text>
          <Text style={styles.pendingText}>
            Para girar un personaje desde distintos ángulos hace falta un modelo
            tridimensional real, no una imagen plana. No se mostrará una
            simulación falsa: esta parte se construirá en un paso posterior.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.workspace,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          <View style={styles.previewColumn}>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewEyebrow}>TU AVATAR</Text>
                <Text style={styles.previewBadge}>
                  {generatedAvatar ? 'GENERADO POR IA' : 'FOTOGRAFÍA ORIGINAL'}
                </Text>
              </View>

              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyEmoji}>🪞</Text>
                  <Text style={styles.emptyTitle}>Todavía no hay avatar</Text>
                  <Text style={styles.emptyText}>
                    Crea uno desde una fotografía para verlo aquí.
                  </Text>
                  <Link href="/create-avatar" asChild>
                    <Pressable style={styles.smallButton}>
                      <Text style={styles.smallButtonText}>CREAR MI AVATAR →</Text>
                    </Pressable>
                  </Link>
                </View>
              )}

              {generatedAvatar && (
                <Text style={styles.previewNote}>
                  Resultado generado a partir de la fotografía. El parecido
                  depende de la calidad de la imagen y del modelo de IA.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.controlsColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>LOOK ACTUAL</Text>
              <Text style={styles.panelTitle}>Prendas seleccionadas</Text>

              {selectedItems.length === 0 ? (
                <Text style={styles.panelHint}>
                  Aún no hay prendas. Elige algunas en Mi armario.
                </Text>
              ) : (
                <View style={styles.chipRow}>
                  {selectedItems.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.itemChip}
                      onPress={() => removeItem(item.id)}
                    >
                      <Text style={styles.itemChipText}>
                        {item.emoji} {item.name} ×
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Link href="/wardrobe" asChild>
                <Pressable style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>IR A MI ARMARIO →</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>BEAUTY STUDIO</Text>
              <Text style={styles.panelTitle}>Cabello</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {HAIR_STYLES.map((style) => (
                    <Pressable
                      key={style}
                      style={[
                        styles.optionChip,
                        hairStyle === style && styles.optionChipActive,
                      ]}
                      onPress={() => setHairStyle(style)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          hairStyle === style && styles.optionChipTextActive,
                        ]}
                      >
                        {style}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.subTitle}>Color</Text>
              <View style={styles.chipRow}>
                {HAIR_COLORS.map((color) => (
                  <Pressable
                    key={color.name}
                    style={[
                      styles.colorChip,
                      hairColor === color.value && styles.colorChipActive,
                    ]}
                    onPress={() => setHairColor(color.value)}
                  >
                    <View
                      style={[styles.colorSwatch, { backgroundColor: color.value }]}
                    />
                    <Text style={styles.colorText}>{color.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>BEAUTY STUDIO</Text>
              <Text style={styles.panelTitle}>Maquillaje</Text>
              <View style={styles.chipRow}>
                {MAKEUP_STYLES.map((style) => (
                  <Pressable
                    key={style}
                    style={[
                      styles.optionChip,
                      makeupStyle === style && styles.optionChipActive,
                    ]}
                    onPress={() => setMakeupStyle(style)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        makeupStyle === style && styles.optionChipTextActive,
                      ]}
                    >
                      {style}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>ACCESORIOS</Text>
              <Text style={styles.panelTitle}>Complementos</Text>
              <View style={styles.chipRow}>
                {accessoryItems.map((item) => {
                  const active = selectedAccessories.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                      onPress={() => toggleAccessory(item.id)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          active && styles.optionChipTextActive,
                        ]}
                      >
                        {item.emoji} {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.panel, styles.savePanel]}>
        <Text style={styles.panelEyebrow}>GUARDADO LOCAL</Text>
        <Text style={styles.panelTitle}>Guarda esta combinación</Text>
        <Text style={styles.panelHint}>
          Tu look se guarda automáticamente en este dispositivo. Ponle nombre
          para encontrarlo después en Mis creaciones.
        </Text>

        <TextInput
          style={styles.nameInput}
          value={lookName}
          onChangeText={setLookName}
          placeholder="Ej. Look de primavera"
          placeholderTextColor="#B79DA9"
        />

        <Pressable style={styles.smallButton} onPress={handleSaveLook}>
          <Text style={styles.smallButtonText}>GUARDAR LOOK ACTUAL →</Text>
        </Pressable>

        {saveMessage !== '' && (
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        )}

        {savedLooks.length > 0 && (
          <Text style={styles.savedCount}>
            {savedLooks.length} look(s) guardados en Mis creaciones
          </Text>
        )}

        <Link href="/my-creations" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>VER MIS CREACIONES →</Text>
          </Pressable>
        </Link>
      </View>

      {!isHydrated && (
        <Text style={styles.storageNote}>
          Restaurando tus datos guardados...
        </Text>
      )}

      {storageError !== '' && storageError !== null && (
        <View style={styles.storageErrorBox}>
          <Text style={styles.storageErrorText}>{storageError}</Text>
        </View>
      )}

      <View style={styles.honestyBox}>
        <Text style={styles.honestyTitle}>Estado real de esta pantalla</Text>
        <Text style={styles.honestyText}>
          • Las prendas, peinados, colores y maquillaje son una selección
          guardada en este dispositivo; todavía no modifican la imagen del avatar.
        </Text>
        <Text style={styles.honestyText}>
          • El probador virtual con IA y el avatar 3D requieren servicios o
          modelos aún no integrados.
        </Text>
        <Text style={styles.honestyText}>
          • El guardado es local, no está cifrado y no se sincroniza entre
          dispositivos: la nube llegará con la autenticación.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MY FASHION STUDIO ✦ YOUR STYLE, YOUR RULES
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },
  content: {
    padding: 25,
    paddingBottom: 55,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    color: '#C36E94',
    fontWeight: '700',
    marginBottom: 30,
  },
  eyebrow: {
    color: '#C27696',
    letterSpacing: 2,
    fontWeight: '800',
    fontSize: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#604653',
    marginTop: 10,
  },
  description: {
    color: '#927A87',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 22,
    maxWidth: 650,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  modeButton: {
    backgroundColor: '#F5E7EE',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
  },
  modeActive: {
    backgroundColor: '#D879A1',
  },
  modeText: {
    color: '#97687E',
    fontSize: 11,
    fontWeight: '800',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  pendingBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DCE6',
    borderRadius: 20,
    padding: 24,
  },
  pendingTitle: {
    color: '#604653',
    fontSize: 19,
    fontWeight: '800',
  },
  pendingText: {
    color: '#927A87',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
  workspace: {
    gap: 18,
  },
  previewColumn: {
    flex: 1,
    minWidth: 0,
  },
  controlsColumn: {
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  previewCard: {
    backgroundColor: '#F9EAF1',
    borderRadius: 24,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  previewEyebrow: {
    color: '#B36B8A',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
  },
  previewBadge: {
    color: '#A45E7D',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 8,
    fontWeight: '900',
  },
  previewImage: {
    width: '100%',
    height: 460,
    borderRadius: 18,
    backgroundColor: '#F2D3E1',
  },
  emptyPreview: {
    height: 460,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  emptyEmoji: {
    fontSize: 45,
  },
  emptyTitle: {
    color: '#604653',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: '#927A87',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  previewNote: {
    color: '#A15D7E',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    borderRadius: 20,
    padding: 18,
  },
  panelEyebrow: {
    color: '#C27696',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 5,
  },
  panelTitle: {
    color: '#604653',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  subTitle: {
    color: '#A66A84',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 10,
  },
  panelHint: {
    color: '#96838D',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  itemChip: {
    backgroundColor: '#F9EAF1',
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  itemChipText: {
    color: '#A15D7E',
    fontSize: 11,
    fontWeight: '700',
  },
  optionChip: {
    backgroundColor: '#F5E7EE',
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  optionChipActive: {
    backgroundColor: '#D879A1',
  },
  optionChipText: {
    color: '#97687E',
    fontSize: 11,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  colorChip: {
    alignItems: 'center',
    gap: 5,
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipActive: {
    borderColor: '#D879A1',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorText: {
    color: '#97687E',
    fontSize: 9,
    fontWeight: '700',
  },
  smallButton: {
    backgroundColor: '#D879A1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  savePanel: {
    marginTop: 18,
  },
  nameInput: {
    backgroundColor: '#F9EAF1',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#604653',
    fontSize: 13,
    marginBottom: 14,
  },
  saveMessage: {
    color: '#6C9B7A',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
  },
  savedCount: {
    color: '#A66A84',
    fontSize: 11,
    marginTop: 10,
  },
  secondaryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#C36E94',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  storageNote: {
    color: '#A66A84',
    fontSize: 11,
    marginTop: 14,
  },
  storageErrorBox: {
    backgroundColor: '#FCE8E8',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  storageErrorText: {
    color: '#A52A2A',
    fontSize: 11,
    lineHeight: 17,
  },
  honestyBox: {
    backgroundColor: '#FCEFF4',
    borderRadius: 18,
    padding: 20,
    marginTop: 22,
  },
  honestyTitle: {
    color: '#A15D7E',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  honestyText: {
    color: '#8E7481',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#F1DFE8',
    marginTop: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#B18D9F',
    fontSize: 9,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
