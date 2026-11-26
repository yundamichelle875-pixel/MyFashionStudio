import { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Link } from 'expo-router';

import { useFashion } from '../context/FashionContext';
import { API_URL } from '../services/api';
import { createPersistentImageDataUri } from '../services/local-images';

type PhotoSource = 'gallery' | 'camera';

type EditedPhoto = {
  uri: string;
  dataUri: string;
  storedUri: string;
  width: number;
  height: number;
};

type ManipulatorContext = ReturnType<typeof ImageManipulator.manipulate>;
type RenderedImage = Awaited<ReturnType<ManipulatorContext['renderAsync']>>;

/** Recorte centrado 3:4 calculado sobre las dimensiones reales de la imagen. */
function buildPortraitCrop(width: number, height: number) {
  const ratio = 3 / 4;

  let cropWidth = width;
  let cropHeight = height;

  if (width / height > ratio) {
    cropWidth = height * ratio;
  } else {
    cropHeight = width / ratio;
  }

  const originX = Math.max(0, Math.round((width - cropWidth) / 2));
  const originY = Math.max(0, Math.round((height - cropHeight) / 2));

  return {
    originX,
    originY,
    width: Math.max(1, Math.min(Math.round(cropWidth), width - originX)),
    height: Math.max(1, Math.min(Math.round(cropHeight), height - originY)),
  };
}

export default function CreateAvatarScreen() {
  const { setAvatarPhoto, setGeneratedAvatar } = useFashion();

  const [original, setOriginal] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [source, setSource] = useState<PhotoSource | null>(null);
  const [edited, setEdited] = useState<EditedPhoto | null>(null);
  const [rotation, setRotation] = useState(0);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';

  const applyEdits = async (
    asset: ImagePicker.ImagePickerAsset,
    nextRotation: number,
    nextCrop: boolean
  ) => {
    setBusy(true);
    setErrorMessage('');
    setAvatarUri(null);
    setConfirmed(false);

    let context: ManipulatorContext | null = null;
    let rendered: RenderedImage | null = null;

    try {
      const swapped = nextRotation % 180 !== 0;
      const workingWidth = swapped ? asset.height : asset.width;
      const workingHeight = swapped ? asset.width : asset.height;

      context = ImageManipulator.manipulate(asset.uri);

      if (nextRotation !== 0) {
        context.rotate(nextRotation);
      }

      if (nextCrop) {
        context.crop(buildPortraitCrop(workingWidth, workingHeight));
      }

      // Limita el tamaño del envío a la IA sin deformar la proporción.
      if (workingWidth > 1200) {
        context.resize({ width: 1200, height: null });
      }

      rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: 0.85,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!saved.base64) {
        throw new Error('No pudimos preparar la fotografía.');
      }

      const dataUri = `data:image/jpeg;base64,${saved.base64}`;

      if (dataUri.length > 14_000_000) {
        throw new Error('La fotografía es demasiado grande. Prueba con otra.');
      }

      // Copia reducida para guardarla en el dispositivo. La imagen que se
      // envía a la IA sigue siendo la de mayor calidad (`dataUri`).
      const storedUri = await createPersistentImageDataUri(saved.uri, 720, 0.7);

      setEdited({
        uri: saved.uri,
        dataUri,
        storedUri,
        width: saved.width,
        height: saved.height,
      });
      setGeneratedAvatar(null);
    } catch (error) {
      setEdited(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos procesar la fotografía.'
      );
    } finally {
      rendered?.release();
      context?.release();
      setBusy(false);
    }
  };

  const handleResult = (
    result: ImagePicker.ImagePickerResult,
    pickedSource: PhotoSource
  ) => {
    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const mime = asset.mimeType || 'image/jpeg';

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) {
      setErrorMessage('Selecciona una fotografía JPG, PNG o WEBP.');
      return;
    }

    setOriginal(asset);
    setSource(pickedSource);
    setRotation(0);
    setCropEnabled(false);
    setStatusMessage('Fotografía seleccionada. Ahora puedes ajustarla. ✨');
    void applyEdits(asset, 0, false);
  };

  const pickFromGallery = async () => {
    setErrorMessage('');
    setStatusMessage('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: false,
      });

      handleResult(result, 'gallery');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos abrir la galería.'
      );
    }
  };

  const takePhoto = async () => {
    setErrorMessage('');
    setStatusMessage('');

    try {
      if (!isWeb) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setErrorMessage(
            permission.canAskAgain
              ? 'Necesitamos permiso de cámara para tomar la fotografía.'
              : 'Activa el permiso de cámara en los ajustes del dispositivo.'
          );
          return;
        }
      }

      // En web debe llamarse directamente desde el toque del botón.
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front,
        quality: 0.85,
        base64: false,
      });

      handleResult(result, 'camera');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos abrir la cámara.'
      );
    }
  };

  const rotatePhoto = () => {
    if (!original || busy) return;

    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    void applyEdits(original, nextRotation, cropEnabled);
  };

  const toggleCrop = () => {
    if (!original || busy) return;

    const nextCrop = !cropEnabled;
    setCropEnabled(nextCrop);
    void applyEdits(original, rotation, nextCrop);
  };

  const confirmPhoto = () => {
    if (!edited) return;

    setAvatarPhoto(edited.storedUri);
    setGeneratedAvatar(null);
    setConfirmed(true);
    setStatusMessage(
      'Fotografía confirmada y guardada en este dispositivo. Ya puedes generar tu avatar. 💗'
    );
    setErrorMessage('');
  };

  const removePhoto = () => {
    setOriginal(null);
    setSource(null);
    setEdited(null);
    setRotation(0);
    setCropEnabled(false);
    setConfirmed(false);
    setAvatarUri(null);
    setStatusMessage('');
    setErrorMessage('');
    setAvatarPhoto(null);
    setGeneratedAvatar(null);
  };

  const generateAvatar = async () => {
    if (!edited || !confirmed) {
      setErrorMessage('Primero selecciona y confirma una fotografía.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setAvatarUri(null);
    setStatusMessage('Preparando tu fotografía...');

    try {
      const response = await fetch(`${API_URL}/api/avatars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUri: edited.dataUri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No pudimos iniciar la generación.');
      }

      const predictionId = data.id;
      setStatusMessage('La IA está creando tu avatar... 💗');

      let completed = false;

      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `${API_URL}/api/avatars/${encodeURIComponent(predictionId)}`
        );
        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(statusData.error || 'Error consultando el progreso.');
        }

        if (statusData.status === 'completed') {
          const generatedImage = statusData.output?.[0];

          if (!generatedImage) {
            throw new Error('La IA no devolvió una imagen.');
          }

          setAvatarUri(generatedImage);
          setGeneratedAvatar(generatedImage);
          setStatusMessage('¡Tu avatar está listo! ✨');
          completed = true;
          break;
        }

        if (statusData.status === 'failed') {
          const detail =
            typeof statusData.error === 'string'
              ? statusData.error
              : statusData.error?.message;

          throw new Error(detail || 'La generación no pudo completarse.');
        }

        setStatusMessage(
          attempt < 15
            ? 'Creando tu avatar... ✨'
            : 'Estamos terminando los últimos detalles...'
        );
      }

      if (!completed) {
        throw new Error(
          'La generación está tardando demasiado. Intenta consultar nuevamente.'
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error creando tu avatar.'
      );
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable>
          <Text style={styles.back}>← Volver al inicio</Text>
        </Pressable>
      </Link>

      <Text style={styles.eyebrow}>MY FASHION STUDIO ✦</Text>
      <Text style={styles.title}>Crea tu propio avatar</Text>
      <Text style={styles.description}>
        Elige una fotografía, ajústala y confírmala. Después la enviaremos al
        servicio de inteligencia artificial para generar tu avatar.
      </Text>

      <View style={styles.stepRow}>
        <Text style={[styles.step, original && styles.stepDone]}>
          1 · Elegir foto
        </Text>
        <Text style={[styles.step, confirmed && styles.stepDone]}>
          2 · Ajustar y confirmar
        </Text>
        <Text style={[styles.step, avatarUri && styles.stepDone]}>
          3 · Generar avatar
        </Text>
      </View>

      {!edited && (
        <View style={styles.uploadBox}>
          <Text style={styles.cameraIcon}>📸</Text>
          <Text style={styles.uploadTitle}>Tu fotografía</Text>
          <Text style={styles.uploadDescription}>
            Selecciona una imagen o toma una foto con la cámara.
          </Text>

          <Pressable
            style={styles.uploadButton}
            onPress={pickFromGallery}
            disabled={busy || loading}
          >
            <Text style={styles.buttonText}>ELEGIR DE GALERÍA / ARCHIVOS</Text>
          </Pressable>

          <Pressable
            style={[styles.uploadButton, styles.cameraButton]}
            onPress={takePhoto}
            disabled={busy || loading}
          >
            <Text style={styles.buttonText}>📷 TOMAR FOTO CON LA CÁMARA</Text>
          </Pressable>

          {isWeb && (
            <Text style={styles.webNote}>
              En navegador de escritorio, “tomar foto” puede abrir el selector
              de archivos en lugar de la cámara en vivo. La cámara en vivo se
              añadirá en un paso posterior con una build de desarrollo.
            </Text>
          )}
        </View>
      )}

      {edited && (
        <View style={styles.uploadBox}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>
              {source === 'camera' ? 'FOTO TOMADA' : 'FOTO SELECCIONADA'}
            </Text>
            <Text style={styles.previewLabel}>
              {edited.width} × {edited.height} px
            </Text>
          </View>

          <View style={styles.photoFrame}>
            <Image
              source={{ uri: edited.uri }}
              style={styles.preview}
              resizeMode="contain"
            />
          </View>

          <View style={styles.editRow}>
            <Pressable
              style={styles.editButton}
              onPress={rotatePhoto}
              disabled={busy || loading}
            >
              <Text style={styles.editButtonText}>↻ GIRAR 90°</Text>
            </Pressable>

            <Pressable
              style={[styles.editButton, cropEnabled && styles.editButtonActive]}
              onPress={toggleCrop}
              disabled={busy || loading}
            >
              <Text style={styles.editButtonText}>
                {cropEnabled ? '✓ RECORTE 3:4' : '✂ RECORTAR 3:4'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.editRow}>
            <Pressable
              style={styles.editButton}
              onPress={pickFromGallery}
              disabled={busy || loading}
            >
              <Text style={styles.editButtonText}>CAMBIAR FOTO</Text>
            </Pressable>

            <Pressable style={styles.editButton} onPress={removePhoto}>
              <Text style={styles.editButtonText}>ELIMINAR FOTO</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.confirmButton, confirmed && styles.confirmButtonActive]}
            onPress={confirmPhoto}
            disabled={busy || loading || confirmed}
          >
            <Text style={styles.buttonText}>
              {confirmed ? '✓ FOTOGRAFÍA CONFIRMADA' : 'USAR ESTA FOTOGRAFÍA'}
            </Text>
          </Pressable>
        </View>
      )}

      {busy && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#D879A1" />
          <Text style={styles.loadingText}>Preparando tu fotografía...</Text>
        </View>
      )}

      {statusMessage !== '' && (
        <Text style={styles.status}>{statusMessage}</Text>
      )}

      {errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <Pressable
        style={[
          styles.generateButton,
          (!confirmed || loading || busy) && styles.disabledButton,
        ]}
        onPress={generateAvatar}
        disabled={!confirmed || loading || busy}
      >
        <Text style={styles.buttonText}>
          {loading ? 'CREANDO TU AVATAR...' : 'GENERAR MI AVATAR ✨'}
        </Text>
      </Pressable>

      {avatarUri && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>¡Tu avatar está listo! ♡</Text>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            resizeMode="contain"
          />
          <Text style={styles.resultDescription}>
            Imagen generada por IA a partir de tu fotografía confirmada. El
            parecido depende de la calidad de la imagen y del modelo utilizado.
          </Text>

          <Link href="/fashion-studio" asChild>
            <Pressable style={styles.openStudioButton}>
              <Text style={styles.buttonText}>ABRIR EN FASHION STUDIO →</Text>
            </Pressable>
          </Link>
        </View>
      )}

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>♡ Consejitos para tu fotografía</Text>
        <Text style={styles.tip}>• Utiliza buena iluminación frontal.</Text>
        <Text style={styles.tip}>• Procura que el rostro sea visible.</Text>
        <Text style={styles.tip}>• Evita imágenes borrosas o muy oscuras.</Text>
        <Text style={styles.tip}>
          • Solo usa fotografías tuyas o de personas que te hayan autorizado.
        </Text>
      </View>

      <Text style={styles.footer}>
        MY FASHION STUDIO · YOUR STYLE, YOUR WORLD
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },
  content: {
    padding: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  back: {
    color: '#C36E94',
    fontWeight: '700',
    marginBottom: 40,
  },
  eyebrow: {
    color: '#C27696',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
  },
  title: {
    color: '#604653',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    color: '#927A87',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 25,
    textAlign: 'center',
    maxWidth: 550,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  step: {
    backgroundColor: '#F5E7EE',
    color: '#97687E',
    fontSize: 10,
    fontWeight: '800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  stepDone: {
    backgroundColor: '#D879A1',
    color: '#FFFFFF',
  },
  uploadBox: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: '#F9EAF1',
    borderWidth: 2,
    borderColor: '#E9BED0',
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 55,
    marginBottom: 15,
  },
  uploadTitle: {
    fontSize: 22,
    color: '#604653',
    fontWeight: '800',
  },
  uploadDescription: {
    color: '#927A87',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  previewLabel: {
    color: '#A56D85',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#F2D3E1',
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  editRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  editButtonActive: {
    backgroundColor: '#C36E94',
  },
  editButtonText: {
    color: '#A45E7D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  uploadButton: {
    backgroundColor: '#D879A1',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginTop: 20,
  },
  cameraButton: {
    backgroundColor: '#A85F81',
  },
  confirmButton: {
    backgroundColor: '#A85F81',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginTop: 22,
    width: '100%',
  },
  confirmButtonActive: {
    backgroundColor: '#6C9B7A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#A85F81',
    padding: 19,
    borderRadius: 30,
    width: '100%',
    maxWidth: 550,
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.45,
  },
  status: {
    color: '#A45E7D',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  loadingText: {
    color: '#927A87',
    fontSize: 13,
  },
  resultBox: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: '#F9EAF1',
    padding: 20,
    borderRadius: 24,
    marginTop: 25,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#604653',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
  },
  avatarImage: {
    width: '100%',
    height: 480,
    borderRadius: 18,
  },
  resultDescription: {
    color: '#927A87',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  openStudioButton: {
    backgroundColor: '#D879A1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    marginTop: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FCE8E8',
    borderRadius: 14,
    padding: 15,
    marginTop: 20,
  },
  errorText: {
    color: '#A52A2A',
    textAlign: 'center',
  },
  webNote: {
    color: '#A38D98',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 20,
  },
  tipBox: {
    width: '100%',
    maxWidth: 550,
    marginTop: 30,
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  tipTitle: {
    color: '#604653',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 12,
  },
  tip: {
    color: '#927A87',
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    color: '#B18D9F',
    fontSize: 9,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 40,
  },
});
