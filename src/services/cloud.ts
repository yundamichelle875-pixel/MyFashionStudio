import type { FashionItem } from '../data/catalog';
import { compactItem, normalizePersistedState, type PersistedState } from './local-storage';
import { requireFirebase } from './firebase';

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadString,
} from 'firebase/storage';

const STATE_COLLECTION = 'fashionStates';

type UploadCache = Map<string, Promise<string>>;

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Sube imágenes guardadas como data URL a Storage y devuelve su URL pública
 * de descarga. Las URL remotas del proveedor de IA se conservan como texto:
 * no se copian a Storage porque dependen de CORS y de la vigencia del proveedor.
 */
async function uploadImage(
  uri: string | null,
  path: string,
  cache: UploadCache
): Promise<string | null> {
  if (!uri) return null;

  if (!uri.startsWith('data:')) {
    return uri;
  }

  const cached = cache.get(uri);
  if (cached) return cached;

  const { storage } = requireFirebase();
  const imageRef = ref(storage, path);

  const task = (async () => {
    await uploadString(imageRef, uri, 'data_url', {
      contentType: 'image/jpeg',
    });
    return getDownloadURL(imageRef);
  })();

  cache.set(uri, task);

  try {
    return await task;
  } catch (error) {
    cache.delete(uri);
    throw error;
  }
}

export async function saveCloudState(
  uid: string,
  state: PersistedState
): Promise<void> {
  const { db } = requireFirebase();
  const cache: UploadCache = new Map();

  const avatarPhoto = await uploadImage(
    state.avatarPhoto,
    `users/${uid}/avatars/original.jpg`,
    cache
  );

  const generatedAvatar = await uploadImage(
    state.generatedAvatar,
    `users/${uid}/avatars/generated.jpg`,
    cache
  );

  const customItems = await Promise.all(
    state.customItems.map(async (item) => ({
      ...item,
      imageUri:
        (await uploadImage(
          item.imageUri ?? null,
          `users/${uid}/clothing/${safeId(item.id)}.jpg`,
          cache
        )) ?? undefined,
    }))
  );

  const customById = new Map(customItems.map((item) => [item.id, item]));

  const resolveItem = (item: FashionItem): FashionItem => {
    const compact = compactItem(item);

    if (compact.custom) {
      return customById.get(compact.id) ?? compact;
    }

    return compact;
  };

  const avatarHistory = await Promise.all(
    state.avatarHistory.map(async (record) => ({
      ...record,
      uri:
        (await uploadImage(
          record.uri,
          `users/${uid}/avatars/history/${safeId(record.id)}.jpg`,
          cache
        )) ?? record.uri,
    }))
  );

  const savedLooks = await Promise.all(
    state.savedLooks.map(async (look) => ({
      ...look,
      items: look.items.map(resolveItem),
      avatarPhoto: await uploadImage(
        look.avatarPhoto,
        `users/${uid}/looks/${safeId(look.id)}-avatar.jpg`,
        cache
      ),
      generatedAvatar: await uploadImage(
        look.generatedAvatar,
        `users/${uid}/looks/${safeId(look.id)}-generated.jpg`,
        cache
      ),
    }))
  );

  await setDoc(doc(db, STATE_COLLECTION, uid), {
    avatarPhoto,
    generatedAvatar,
    avatarHistory,
    selectedItems: state.selectedItems.map(resolveItem),
    customItems,
    hairStyle: state.hairStyle,
    hairColor: state.hairColor,
    makeupStyle: state.makeupStyle,
    selectedAccessories: state.selectedAccessories,
    savedLooks,
    updatedAt: serverTimestamp(),
  });
}

export async function loadCloudState(
  uid: string
): Promise<PersistedState | null> {
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, STATE_COLLECTION, uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizePersistedState(snapshot.data());
}

export async function deleteCloudUserData(uid: string): Promise<void> {
  const { db, storage } = requireFirebase();

  try {
    const root = ref(storage, `users/${uid}`);
    const listing = await listAll(root);

    await Promise.all([
      ...listing.items.map((item) => deleteObject(item)),
      ...listing.prefixes.map(async (folder) => {
        const nested = await listAll(folder);
        await Promise.all(nested.items.map((item) => deleteObject(item)));
      }),
    ]);
  } catch {
    // Puede no haber archivos todavía; el documento se borra de todos modos.
  }

  await deleteDoc(doc(db, STATE_COLLECTION, uid));
}

export function describeCloudError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code === 'permission-denied' || code === 'storage/unauthorized') {
    return 'Firebase rechazó el acceso. Revisa las reglas de seguridad.';
  }

  if (code === 'storage/quota-exceeded') {
    return 'Se agotó el espacio de Firebase Storage.';
  }

  if (code === 'unavailable' || code === 'network-request-failed') {
    return 'No hay conexión con Firebase. Revisa tu red.';
  }

  if (code === 'not-found') {
    return 'No hay datos guardados en la nube para esta cuenta.';
  }

  return error instanceof Error
    ? error.message
    : 'No pudimos completar la operación en la nube.';
}
