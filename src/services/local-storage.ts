import AsyncStorage from '@react-native-async-storage/async-storage';

import { CATALOG, type FashionItem } from '../data/catalog';

export const LOCAL_STORAGE_KEY = '@my_fashion_studio/state/v1';

export const DEFAULT_HAIR_STYLE = 'Ondulado natural';
export const DEFAULT_HAIR_COLOR = '#6B4534';
export const DEFAULT_MAKEUP_STYLE = 'Natural';

export type AvatarRecord = {
  id: string;
  uri: string;
  createdAt: string;
};

export type SavedLook = {
  id: string;
  name: string;
  createdAt: string;
  items: FashionItem[];
  accessories: string[];
  hairStyle: string;
  hairColor: string;
  makeupStyle: string;
  avatarPhoto: string | null;
  generatedAvatar: string | null;
};

export type PersistedState = {
  avatarPhoto: string | null;
  generatedAvatar: string | null;
  avatarHistory: AvatarRecord[];
  selectedItems: FashionItem[];
  customItems: FashionItem[];
  hairStyle: string;
  hairColor: string;
  makeupStyle: string;
  selectedAccessories: string[];
  savedLooks: SavedLook[];
};

const MAX_AVATARS = 8;
const MAX_LOOKS = 20;

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sanitizeItem(value: unknown): FashionItem | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Record<string, unknown>;
  const id = asString(item.id);
  const name = asString(item.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    category: asString(item.category, 'Mis prendas'),
    emoji: asString(item.emoji, '👗'),
    color: asString(item.color, '#F5E3EC'),
    imageUri: asNullableString(item.imageUri) ?? undefined,
    custom: item.custom === true,
  };
}

function sanitizeItems(value: unknown): FashionItem[] {
  return asArray(value)
    .map(sanitizeItem)
    .filter((item): item is FashionItem => item !== null);
}

function sanitizeAvatar(value: unknown): AvatarRecord | null {
  if (!value || typeof value !== 'object') return null;

  const avatar = value as Record<string, unknown>;
  const uri = asString(avatar.uri);

  if (!uri) return null;

  return {
    id: asString(avatar.id, `avatar-${Date.now()}`),
    uri,
    createdAt: asString(avatar.createdAt, new Date().toISOString()),
  };
}

function sanitizeLook(value: unknown): SavedLook | null {
  if (!value || typeof value !== 'object') return null;

  const look = value as Record<string, unknown>;
  const id = asString(look.id);

  if (!id) return null;

  return {
    id,
    name: asString(look.name, 'Look guardado'),
    createdAt: asString(look.createdAt, new Date().toISOString()),
    items: sanitizeItems(look.items),
    accessories: asArray(look.accessories).filter(
      (entry): entry is string => typeof entry === 'string'
    ),
    hairStyle: asString(look.hairStyle, DEFAULT_HAIR_STYLE),
    hairColor: asString(look.hairColor, DEFAULT_HAIR_COLOR),
    makeupStyle: asString(look.makeupStyle, DEFAULT_MAKEUP_STYLE),
    avatarPhoto: asNullableString(look.avatarPhoto),
    generatedAvatar: asNullableString(look.generatedAvatar),
  };
}

/** Evita duplicar imágenes de prendas propias dentro del JSON guardado. */
export function compactItem(item: FashionItem): FashionItem {
  if (!item.custom) return item;

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    emoji: item.emoji,
    color: item.color,
    custom: true,
  };
}

/** Recupera la foto real de cada prenda propia desde el armario guardado. */
export function expandItems(
  items: FashionItem[],
  customItems: FashionItem[]
): FashionItem[] {
  const customById = new Map(customItems.map((item) => [item.id, item]));
  const catalogById = new Map(CATALOG.map((item) => [item.id, item]));

  return items.map((item) => {
    if (item.custom) {
      return customById.get(item.id) ?? item;
    }

    return catalogById.get(item.id) ?? item;
  });
}

export function emptyPersistedState(): PersistedState {
  return {
    avatarPhoto: null,
    generatedAvatar: null,
    avatarHistory: [],
    selectedItems: [],
    customItems: [],
    hairStyle: DEFAULT_HAIR_STYLE,
    hairColor: DEFAULT_HAIR_COLOR,
    makeupStyle: DEFAULT_MAKEUP_STYLE,
    selectedAccessories: [],
    savedLooks: [],
  };
}

export function normalizePersistedState(value: unknown): PersistedState {
  const parsed: Record<string, unknown> =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

  const customItems = sanitizeItems(parsed.customItems);

  return {
    avatarPhoto: asNullableString(parsed.avatarPhoto),
    generatedAvatar: asNullableString(parsed.generatedAvatar),
    avatarHistory: asArray(parsed.avatarHistory)
      .map(sanitizeAvatar)
      .filter((avatar): avatar is AvatarRecord => avatar !== null)
      .slice(0, MAX_AVATARS),
    selectedItems: expandItems(sanitizeItems(parsed.selectedItems), customItems),
    customItems,
    hairStyle: asString(parsed.hairStyle, DEFAULT_HAIR_STYLE),
    hairColor: asString(parsed.hairColor, DEFAULT_HAIR_COLOR),
    makeupStyle: asString(parsed.makeupStyle, DEFAULT_MAKEUP_STYLE),
    selectedAccessories: asArray(parsed.selectedAccessories).filter(
      (entry): entry is string => typeof entry === 'string'
    ),
    savedLooks: asArray(parsed.savedLooks)
      .map(sanitizeLook)
      .filter((look): look is SavedLook => look !== null)
      .slice(0, MAX_LOOKS)
      .map((look) => ({
        ...look,
        items: expandItems(look.items, customItems),
      })),
  };
}

export async function loadLocalState(): Promise<PersistedState> {
  const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

  if (!raw) {
    return emptyPersistedState();
  }

  try {
    return normalizePersistedState(JSON.parse(raw));
  } catch {
    return emptyPersistedState();
  }
}

export async function saveLocalState(state: PersistedState): Promise<void> {
  const serializable: PersistedState = {
    ...state,
    selectedItems: state.selectedItems.map(compactItem),
    savedLooks: state.savedLooks.map((look) => ({
      ...look,
      items: look.items.map(compactItem),
    })),
  };

  await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializable));
}

export async function removeLocalState(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
}
