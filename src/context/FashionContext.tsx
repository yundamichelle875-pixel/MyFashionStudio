/* eslint-disable react-hooks/set-state-in-effect -- La sincronización con Auth y storage es un efecto intencionado. */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { FashionItem } from '../data/catalog';
import {
  deleteCloudUserData,
  describeCloudError,
  loadCloudState,
  saveCloudState,
} from '../services/cloud';
import { isFirebaseConfigured } from '../services/firebase';
import {
  DEFAULT_HAIR_COLOR,
  DEFAULT_HAIR_STYLE,
  DEFAULT_MAKEUP_STYLE,
  loadLocalState,
  normalizePersistedState,
  removeLocalState,
  saveLocalState,
  type AvatarRecord,
  type PersistedState,
  type SavedLook,
} from '../services/local-storage';
import { useAuth } from './AuthContext';

// Se reexporta el tipo para no romper el código que lo importaba desde aquí.
export type { FashionItem } from '../data/catalog';
export type { AvatarRecord, SavedLook } from '../services/local-storage';

export type CloudStatus = 'disabled' | 'signed-out' | 'syncing' | 'synced' | 'error';

type FashionContextType = {
  /** true cuando ya se leyó el guardado local; evita sobrescribirlo al iniciar. */
  isHydrated: boolean;
  storageError: string | null;

  cloudStatus: CloudStatus;
  cloudMessage: string | null;
  lastSyncedAt: string | null;
  uploadLocalToCloud: () => void;
  downloadCloudToLocal: () => void;
  deleteCloudData: () => void;

  /** URI reducida y persistida de la fotografía original. */
  avatarPhoto: string | null;
  setAvatarPhoto: (photo: string | null) => void;

  /** Último avatar generado; al asignarlo se añade al historial local. */
  generatedAvatar: string | null;
  setGeneratedAvatar: (uri: string | null) => void;

  avatarHistory: AvatarRecord[];
  selectAvatar: (id: string) => void;
  deleteAvatar: (id: string) => void;

  /** Prendas elegidas en Mi armario; se comparten con Fashion Studio. */
  selectedItems: FashionItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<FashionItem[]>>;

  /** Fotografías de ropa propia subidas por la usuaria. */
  customItems: FashionItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<FashionItem[]>>;

  hairStyle: string;
  setHairStyle: (style: string) => void;

  hairColor: string;
  setHairColor: (color: string) => void;

  makeupStyle: string;
  setMakeupStyle: (style: string) => void;

  /** IDs de accesorios del catálogo seleccionados en Fashion Studio. */
  selectedAccessories: string[];
  setSelectedAccessories: React.Dispatch<React.SetStateAction<string[]>>;

  savedLooks: SavedLook[];
  saveCurrentLook: (name: string) => SavedLook;
  loadLook: (id: string) => void;
  deleteLook: (id: string) => void;
  clearLocalData: () => void;
};

const FashionContext = createContext<FashionContextType | undefined>(
  undefined
);

export function FashionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(
    isFirebaseConfigured ? 'signed-out' : 'disabled'
  );
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [generatedAvatar, setGeneratedAvatarState] = useState<string | null>(
    null
  );
  const [avatarHistory, setAvatarHistory] = useState<AvatarRecord[]>([]);
  const [selectedItems, setSelectedItems] = useState<FashionItem[]>([]);
  const [customItems, setCustomItems] = useState<FashionItem[]>([]);
  const [hairStyle, setHairStyle] = useState(DEFAULT_HAIR_STYLE);
  const [hairColor, setHairColor] = useState(DEFAULT_HAIR_COLOR);
  const [makeupStyle, setMakeupStyle] = useState(DEFAULT_MAKEUP_STYLE);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);

  const applyingCloudRef = useRef(false);
  const cloudBusyRef = useRef(false);
  const initialSyncDoneRef = useRef(false);
  // Plazo durante el que se ignora un guardado incremental (por ejemplo,
  // justo después de aplicar datos descargados o de borrar todo). A diferencia
  // de un booleano, no se queda activo si no llega a haber otro cambio.
  const skipCloudSaveUntilRef = useRef(0);

  const currentState = useMemo<PersistedState>(
    () => ({
      avatarPhoto,
      generatedAvatar,
      avatarHistory,
      selectedItems,
      customItems,
      hairStyle,
      hairColor,
      makeupStyle,
      selectedAccessories,
      savedLooks,
    }),
    [
      avatarPhoto,
      generatedAvatar,
      avatarHistory,
      selectedItems,
      customItems,
      hairStyle,
      hairColor,
      makeupStyle,
      selectedAccessories,
      savedLooks,
    ]
  );

  const applyState = useCallback((state: PersistedState) => {
    setAvatarPhoto(state.avatarPhoto);
    setGeneratedAvatarState(state.generatedAvatar);
    setAvatarHistory(state.avatarHistory);
    setSelectedItems(state.selectedItems);
    setCustomItems(state.customItems);
    setHairStyle(state.hairStyle);
    setHairColor(state.hairColor);
    setMakeupStyle(state.makeupStyle);
    setSelectedAccessories(state.selectedAccessories);
    setSavedLooks(state.savedLooks);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await loadLocalState();

        if (active) {
          applyState(stored);
        }
      } catch {
        if (active) {
          setStorageError(
            'No pudimos leer tus datos guardados. Se usará un estado vacío.'
          );
        }
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [applyState]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      saveLocalState(currentState)
        .then(() => setStorageError(null))
        .catch(() =>
          setStorageError(
            'No hay espacio local suficiente. Prueba a quitar alguna prenda o avatar guardado.'
          )
        );
    }, 300);

    return () => clearTimeout(timer);
  }, [isHydrated, currentState]);

  // Primera sincronización al iniciar sesión. La nube gana si ya hay datos.
  useEffect(() => {
    if (!user) {
      initialSyncDoneRef.current = false;
      setCloudStatus(isFirebaseConfigured ? 'signed-out' : 'disabled');
      setLastSyncedAt(null);
      return;
    }

    if (!isHydrated || initialSyncDoneRef.current) return;

    initialSyncDoneRef.current = true;
    cloudBusyRef.current = true;
    setCloudStatus('syncing');
    setCloudMessage('Sincronizando con tu cuenta...');

    (async () => {
      try {
        const remote = await loadCloudState(user.uid);

        if (remote) {
          // Evita volver a subir inmediatamente lo que acabamos de descargar.
          skipCloudSaveUntilRef.current = Date.now() + 2500;
          applyingCloudRef.current = true;
          applyState(normalizePersistedState(remote));
          setCloudMessage('Tus datos se descargaron de la nube. ♡');
        } else {
          // No subimos el estado local de forma automática: podría pertenecer
          // a otra cuenta que usó este dispositivo. El botón "SUBIR LOCALES"
          // permite decidirlo explícitamente.
          setCloudMessage(
            'Esta cuenta no tiene datos en la nube. Usa «SUBIR LOCALES» si quieres guardar los datos de este dispositivo.'
          );
        }

        setLastSyncedAt(new Date().toISOString());
        setCloudStatus('synced');
      } catch (error) {
        setCloudStatus('error');
        setCloudMessage(describeCloudError(error));
      } finally {
        applyingCloudRef.current = false;
        cloudBusyRef.current = false;
      }
    })();
  }, [user, isHydrated, applyState, currentState]);

  // Guardado incremental en la nube mientras haya sesión iniciada.
  useEffect(() => {
    if (!user || !isHydrated || !initialSyncDoneRef.current) return;

    const timer = setTimeout(() => {
      if (skipCloudSaveUntilRef.current > Date.now()) {
        skipCloudSaveUntilRef.current = 0;
        return;
      }

      if (cloudBusyRef.current || applyingCloudRef.current) return;

      cloudBusyRef.current = true;
      setCloudStatus('syncing');

      saveCloudState(user.uid, currentState)
        .then(() => {
          setLastSyncedAt(new Date().toISOString());
          setCloudStatus('synced');
          setCloudMessage('Cambios guardados en la nube.');
        })
        .catch((error) => {
          setCloudStatus('error');
          setCloudMessage(describeCloudError(error));
        })
        .finally(() => {
          cloudBusyRef.current = false;
        });
    }, 1200);

    return () => clearTimeout(timer);
  }, [user, isHydrated, currentState]);

  const setGeneratedAvatar = useCallback((uri: string | null) => {
    setGeneratedAvatarState(uri);

    if (!uri) return;

    setAvatarHistory((previous) => {
      if (previous.some((record) => record.uri === uri)) {
        return previous;
      }

      const record: AvatarRecord = {
        id: `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        uri,
        createdAt: new Date().toISOString(),
      };

      return [record, ...previous].slice(0, 8);
    });
  }, []);

  const selectAvatar = useCallback(
    (id: string) => {
      const record = avatarHistory.find((entry) => entry.id === id);

      if (record) {
        setGeneratedAvatarState(record.uri);
      }
    },
    [avatarHistory]
  );

  const deleteAvatar = useCallback(
    (id: string) => {
      const record = avatarHistory.find((entry) => entry.id === id);

      setAvatarHistory((previous) =>
        previous.filter((entry) => entry.id !== id)
      );

      if (record && generatedAvatar === record.uri) {
        setGeneratedAvatarState(null);
      }
    },
    [avatarHistory, generatedAvatar]
  );

  const saveCurrentLook = useCallback(
    (name: string) => {
      const trimmedName = name.trim();
      const now = new Date();

      const look: SavedLook = {
        id: `look-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmedName || `Look del ${now.toLocaleDateString('es-ES')}`,
        createdAt: now.toISOString(),
        items: selectedItems,
        accessories: selectedAccessories,
        hairStyle,
        hairColor,
        makeupStyle,
        avatarPhoto,
        generatedAvatar,
      };

      setSavedLooks((previous) => [look, ...previous].slice(0, 20));

      return look;
    },
    [
      selectedItems,
      selectedAccessories,
      hairStyle,
      hairColor,
      makeupStyle,
      avatarPhoto,
      generatedAvatar,
    ]
  );

  const loadLook = useCallback(
    (id: string) => {
      const look = savedLooks.find((entry) => entry.id === id);

      if (!look) return;

      setSelectedItems(look.items);
      setSelectedAccessories(look.accessories);
      setHairStyle(look.hairStyle);
      setHairColor(look.hairColor);
      setMakeupStyle(look.makeupStyle);
      setAvatarPhoto(look.avatarPhoto);
      setGeneratedAvatarState(look.generatedAvatar);
    },
    [savedLooks]
  );

  const deleteLook = useCallback((id: string) => {
    setSavedLooks((previous) => previous.filter((look) => look.id !== id));
  }, []);

  const uploadLocalToCloud = useCallback(() => {
    if (!user) return;

    cloudBusyRef.current = true;
    setCloudStatus('syncing');
    setCloudMessage('Subiendo datos a la nube...');

    saveCloudState(user.uid, currentState)
      .then(() => {
        setLastSyncedAt(new Date().toISOString());
        setCloudStatus('synced');
        setCloudMessage('Datos locales subidos correctamente.');
      })
      .catch((error) => {
        setCloudStatus('error');
        setCloudMessage(describeCloudError(error));
      })
      .finally(() => {
        cloudBusyRef.current = false;
      });
  }, [user, currentState]);

  const downloadCloudToLocal = useCallback(() => {
    if (!user) return;

    cloudBusyRef.current = true;
    applyingCloudRef.current = true;
    setCloudStatus('syncing');
    setCloudMessage('Descargando datos de la nube...');

    loadCloudState(user.uid)
      .then((remote) => {
        if (!remote) {
          setCloudMessage('Todavía no hay datos guardados en la nube.');
          return;
        }

        applyState(normalizePersistedState(remote));
        setLastSyncedAt(new Date().toISOString());
        setCloudMessage('Datos de la nube aplicados en este dispositivo.');
        setCloudStatus('synced');
      })
      .catch((error) => {
        setCloudStatus('error');
        setCloudMessage(describeCloudError(error));
      })
      .finally(() => {
        applyingCloudRef.current = false;
        cloudBusyRef.current = false;
      });
  }, [user, applyState]);

  const deleteCloudData = useCallback(() => {
    if (!user) return;

    cloudBusyRef.current = true;
    setCloudStatus('syncing');
    setCloudMessage('Borrando datos de la nube...');

    deleteCloudUserData(user.uid)
      .then(() => {
        setCloudStatus('synced');
        setCloudMessage('Datos de la nube borrados. Los locales se conservan.');
        setLastSyncedAt(null);
      })
      .catch((error) => {
        setCloudStatus('error');
        setCloudMessage(describeCloudError(error));
      })
      .finally(() => {
        cloudBusyRef.current = false;
      });
  }, [user]);

  const clearLocalData = useCallback(() => {
    skipCloudSaveUntilRef.current = Date.now() + 2500;
    setAvatarPhoto(null);
    setGeneratedAvatarState(null);
    setAvatarHistory([]);
    setSelectedItems([]);
    setCustomItems([]);
    setHairStyle(DEFAULT_HAIR_STYLE);
    setHairColor(DEFAULT_HAIR_COLOR);
    setMakeupStyle(DEFAULT_MAKEUP_STYLE);
    setSelectedAccessories([]);
    setSavedLooks([]);
    setStorageError(null);
    void removeLocalState();

    if (user) {
      void deleteCloudUserData(user.uid)
        .then(() => {
          setCloudMessage('Datos locales y de la nube borrados.');
          setLastSyncedAt(null);
        })
        .catch((error) => {
          setCloudStatus('error');
          setCloudMessage(describeCloudError(error));
        });
    }
  }, [user]);

  const value = useMemo<FashionContextType>(
    () => ({
      isHydrated,
      storageError,
      cloudStatus,
      cloudMessage,
      lastSyncedAt,
      uploadLocalToCloud,
      downloadCloudToLocal,
      deleteCloudData,
      avatarPhoto,
      setAvatarPhoto,
      generatedAvatar,
      setGeneratedAvatar,
      avatarHistory,
      selectAvatar,
      deleteAvatar,
      selectedItems,
      setSelectedItems,
      customItems,
      setCustomItems,
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
      loadLook,
      deleteLook,
      clearLocalData,
    }),
    [
      isHydrated,
      storageError,
      cloudStatus,
      cloudMessage,
      lastSyncedAt,
      uploadLocalToCloud,
      downloadCloudToLocal,
      deleteCloudData,
      avatarPhoto,
      generatedAvatar,
      setGeneratedAvatar,
      avatarHistory,
      selectAvatar,
      deleteAvatar,
      selectedItems,
      customItems,
      hairStyle,
      hairColor,
      makeupStyle,
      selectedAccessories,
      savedLooks,
      saveCurrentLook,
      loadLook,
      deleteLook,
      clearLocalData,
    ]
  );

  return (
    <FashionContext.Provider value={value}>{children}</FashionContext.Provider>
  );
}

export function useFashion() {
  const context = useContext(FashionContext);

  if (!context) {
    throw new Error('useFashion debe utilizarse dentro de FashionProvider');
  }

  return context;
}
