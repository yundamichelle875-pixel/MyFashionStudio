import { Image } from 'react-native';

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

type ManipulatorContext = ReturnType<typeof ImageManipulator.manipulate>;
type RenderedImage = Awaited<ReturnType<ManipulatorContext['renderAsync']>>;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

/**
 * Convierte una imagen local en un data URI JPEG reducido, apto para
 * AsyncStorage. No conserva la foto original en alta resolución.
 */
export async function createPersistentImageDataUri(
  uri: string,
  maxWidth = 600,
  compress = 0.7
): Promise<string> {
  let context: ManipulatorContext | null = null;
  let rendered: RenderedImage | null = null;

  try {
    const size = await getImageSize(uri);

    context = ImageManipulator.manipulate(uri);

    if (size.width > maxWidth) {
      context.resize({ width: maxWidth, height: null });
    }

    rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress,
      format: SaveFormat.JPEG,
      base64: true,
    });

    if (!saved.base64) {
      throw new Error('No pudimos preparar la imagen para guardarla.');
    }

    return `data:image/jpeg;base64,${saved.base64}`;
  } finally {
    rendered?.release();
    context?.release();
  }
}
