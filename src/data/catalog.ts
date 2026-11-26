/**
 * Catálogo compartido por Mi armario y Fashion Studio.
 *
 * Importante: las prendas de este catálogo son marcadores de posición
 * (emoji + color). No son fotografías de prendas reales ni resultados de IA.
 * Las prendas propias se agregan en memoria desde Mi armario.
 */

export type FashionItem = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;
  imageUri?: string;
  custom?: boolean;
};

export const CATEGORIES = [
  'Todo',
  'Blusas',
  'Pantalones',
  'Vestidos',
  'Zapatos',
  'Bolsos',
  'Accesorios',
  'Mis prendas',
];

export const CATALOG: FashionItem[] = [
  {
    id: '1',
    name: 'Blusa romántica',
    category: 'Blusas',
    emoji: '👚',
    color: '#F8DDE9',
  },
  {
    id: '2',
    name: 'Top básico',
    category: 'Blusas',
    emoji: '🎀',
    color: '#F5E6EF',
  },
  {
    id: '3',
    name: 'Jeans clásicos',
    category: 'Pantalones',
    emoji: '👖',
    color: '#DDE9F9',
  },
  {
    id: '4',
    name: 'Pantalón elegante',
    category: 'Pantalones',
    emoji: '👖',
    color: '#E8E0E8',
  },
  {
    id: '5',
    name: 'Vestido rosado',
    category: 'Vestidos',
    emoji: '👗',
    color: '#F8DCE9',
  },
  {
    id: '6',
    name: 'Vestido de fiesta',
    category: 'Vestidos',
    emoji: '👗',
    color: '#EADFF2',
  },
  {
    id: '7',
    name: 'Tacones',
    category: 'Zapatos',
    emoji: '👠',
    color: '#F5D9E5',
  },
  {
    id: '8',
    name: 'Tenis casuales',
    category: 'Zapatos',
    emoji: '👟',
    color: '#E6E9F3',
  },
  {
    id: '9',
    name: 'Bolso elegante',
    category: 'Bolsos',
    emoji: '👜',
    color: '#F5E4DC',
  },
  {
    id: '10',
    name: 'Gafas de sol',
    category: 'Accesorios',
    emoji: '🕶️',
    color: '#E7E3F0',
  },
  {
    id: '11',
    name: 'Joyas doradas',
    category: 'Accesorios',
    emoji: '💎',
    color: '#F8EDCC',
  },
  {
    id: '12',
    name: 'Lazo para cabello',
    category: 'Accesorios',
    emoji: '🎀',
    color: '#F7DFEA',
  },
];

/** Opciones de cabello y maquillaje del editor local (solo selección, sin edición de píxeles). */
export const HAIR_STYLES = [
  'Lacio natural',
  'Ondulado natural',
  'Rizado',
  'Corta',
  'Recogido',
  'Trenzas',
];

export const HAIR_COLORS = [
  { name: 'Negro', value: '#2B2328' },
  { name: 'Castaño', value: '#6B4534' },
  { name: 'Rubio', value: '#D9B36B' },
  { name: 'Cobre', value: '#B15E3C' },
  { name: 'Rosa', value: '#D879A1' },
];

export const MAKEUP_STYLES = [
  'Natural',
  'Soft glam',
  'Maquillaje de noche',
  'Maquillaje de fiesta',
];
