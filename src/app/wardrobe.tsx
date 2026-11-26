
import { useMemo, useState } from 'react';

import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';

import { useFashion } from '../context/FashionContext';
import {
  CATALOG as catalog,
  CATEGORIES as categories,
  type FashionItem,
} from '../data/catalog';
import { createPersistentImageDataUri } from '../services/local-images';

export default function WardrobeScreen() {
  const { width } = useWindowDimensions();

  // La selección y las prendas propias viven en FashionContext y se guardan localmente.
  const { selectedItems, setSelectedItems, customItems, setCustomItems } =
    useFashion();

  const [activeCategory, setActiveCategory] = useState('Todo');

  const [notice, setNotice] = useState('');

  const [uploading, setUploading] = useState(false);

  const isDesktop = width >= 850;

  const cardWidth = isDesktop ? '31.5%' : '47%';

  const allItems = useMemo(
    () => [...catalog, ...customItems],
    [customItems]
  );

  const visibleItems = allItems.filter((item) => {
    return (
      activeCategory === 'Todo' ||
      item.category === activeCategory
    );
  });

  // Seleccionar o quitar una prenda del look
  const toggleItem = (item: FashionItem) => {
    const alreadySelected = selectedItems.some(
      (selected) => selected.id === item.id
    );

    if (alreadySelected) {
      setSelectedItems((previous) =>
        previous.filter((selected) => selected.id !== item.id)
      );

      setNotice(`${item.name} fue retirada de tu look.`);
    } else {
      setSelectedItems((previous) => [...previous, item]);

      setNotice(`${item.name} fue agregada a tu look. ✨`);
    }
  };

  // Subir fotografías de prendas propias y guardarlas en el dispositivo.
  const uploadClothing = async () => {
    setNotice('');
    setUploading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const storedUri = await createPersistentImageDataUri(asset.uri, 480, 0.7);

      const newItem: FashionItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: 'Mi prenda personalizada',
        category:
          activeCategory === 'Todo' ||
          activeCategory === 'Mis prendas'
            ? 'Mis prendas'
            : activeCategory,
        emoji: '📸',
        color: '#F5E3EC',
        imageUri: storedUri,
        custom: true,
      };

      setCustomItems((previous) => [newItem, ...previous]);

      setNotice('¡Tu prenda ya está en el armario y guardada localmente! 💗');
    } catch (error) {
      console.error('Error guardando prenda:', error);
      setNotice('No pudimos guardar la fotografía de la prenda.');
    } finally {
      setUploading(false);
    }
  };

  const clearLook = () => {
    setSelectedItems([]);
    setNotice('Tu combinación está vacía. ¡Vamos a crear otra!');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* ENCABEZADO */}

      <Link href="/" asChild>
        <Pressable>
          <Text style={styles.back}>← Volver al inicio</Text>
        </Pressable>
      </Link>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          MY FASHION STUDIO ✦
        </Text>

        <Text style={styles.title}>Mi armario</Text>

        <Text style={styles.description}>
          Todas tus prendas favoritas en un solo lugar.
          Combina, experimenta y crea tu propio estilo.
        </Text>
      </View>

      {/* MI LOOK ACTUAL */}

      <View style={styles.lookSection}>
        <View style={styles.lookHeader}>
          <View>
            <Text style={styles.lookEyebrow}>
              YOUR PERSONAL LOOK
            </Text>

            <Text style={styles.lookTitle}>
              Mi combinación actual
            </Text>
          </View>

          <Text style={styles.counter}>
            {selectedItems.length} prendas
          </Text>
        </View>

        {selectedItems.length === 0 ? (
          <View style={styles.emptyLook}>
            <Text style={styles.emptyEmoji}>🪞</Text>

            <Text style={styles.emptyTitle}>
              ¡Tu look está esperando!
            </Text>

            <Text style={styles.emptyDescription}>
              Selecciona algunas prendas del catálogo
              para comenzar a crear tu combinación.
            </Text>
          </View>
        ) : (
          <View style={styles.selectedContainer}>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.selectedItem}>
                {item.imageUri ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.selectedImage}
                  />
                ) : (
                  <Text style={styles.selectedEmoji}>
                    {item.emoji}
                  </Text>
                )}

                <Text style={styles.selectedName}>
                  {item.name}
                </Text>

                <Pressable onPress={() => toggleItem(item)}>
                  <Text style={styles.removeText}>Quitar ×</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.clearButton}
              onPress={clearLook}
            >
              <Text style={styles.clearButtonText}>
                Limpiar combinación
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* CARGAR PRENDAS */}

      <View style={styles.uploadSection}>
        <View style={styles.uploadTextContainer}>
          <Text style={styles.uploadTitle}>
            ¿Tienes ropa propia?
          </Text>

          <Text style={styles.uploadDescription}>
            Agrega fotografías de tus prendas favoritas.
          </Text>
        </View>

        <Pressable
          style={[styles.uploadButton, uploading && styles.uploadButtonBusy]}
          onPress={uploadClothing}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'GUARDANDO PRENDA...' : '+ SUBIR MI ROPA'}
          </Text>
        </Pressable>
      </View>

      {/* FILTROS */}

      <Text style={styles.sectionTitle}>
        Explora las prendas
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                active && styles.categoryActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* CATÁLOGO */}

      <View style={styles.catalogHeader}>
        <Text style={styles.catalogTitle}>
          {activeCategory === 'Todo'
            ? 'Todas las prendas'
            : activeCategory}
        </Text>

        <Text style={styles.catalogCount}>
          {visibleItems.length} artículos
        </Text>
      </View>

      <View style={styles.grid}>
        {visibleItems.map((item) => {
          const isSelected = selectedItems.some(
            (selected) => selected.id === item.id
          );

          return (
            <Pressable
              key={item.id}
              style={[
                styles.productCard,
                { width: cardWidth },
                isSelected && styles.selectedCard,
              ]}
              onPress={() => toggleItem(item)}
            >
              <View
                style={[
                  styles.productImage,
                  { backgroundColor: item.color },
                ]}
              >
                {item.imageUri ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.clothingPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.productEmoji}>
                    {item.emoji}
                  </Text>
                )}

                {item.custom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>
                      MÍA
                    </Text>
                  </View>
                )}

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {item.name}
                </Text>

                <Text style={styles.productCategory}>
                  {item.category}
                </Text>

                <Text
                  style={[
                    styles.addText,
                    isSelected && styles.addedText,
                  ]}
                >
                  {isSelected
                    ? '✓ AGREGADA'
                    : '+ AGREGAR AL LOOK'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {visibleItems.length === 0 && (
        <View style={styles.emptyLook}>
          <Text style={styles.emptyEmoji}>🎀</Text>

          <Text style={styles.emptyTitle}>
            Todavía no tienes prendas aquí.
          </Text>

          <Text style={styles.emptyDescription}>
            Sube una fotografía de tu ropa para comenzar.
          </Text>
        </View>
      )}

      {notice !== '' && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {/* PIE DE PÁGINA */}

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

  header: {
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
    maxWidth: 550,
  },

  lookSection: {
    backgroundColor: '#F9EAF1',
    borderRadius: 24,
    padding: 22,
    marginBottom: 25,
  },

  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  lookEyebrow: {
    color: '#B36B8A',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
  },

  lookTitle: {
    color: '#604653',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  counter: {
    color: '#A66A84',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyLook: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 25,
    alignItems: 'center',
    borderRadius: 18,
  },

  emptyEmoji: {
    fontSize: 38,
  },

  emptyTitle: {
    color: '#604653',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },

  emptyDescription: {
    color: '#927A87',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },

  selectedContainer: {
    marginTop: 20,
    gap: 12,
  },

  selectedItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  selectedImage: {
    width: 55,
    height: 55,
    borderRadius: 10,
  },

  selectedEmoji: {
    fontSize: 30,
  },

  selectedName: {
    color: '#604653',
    flex: 1,
    fontWeight: '700',
    fontSize: 12,
  },

  removeText: {
    color: '#BF658A',
    fontWeight: '700',
    fontSize: 11,
  },

  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 5,
    padding: 8,
  },

  clearButtonText: {
    color: '#AC6685',
    fontSize: 11,
    fontWeight: '800',
  },

  uploadSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DCE6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    gap: 15,
  },

  uploadTextContainer: {
    gap: 6,
  },

  uploadTitle: {
    color: '#604653',
    fontSize: 17,
    fontWeight: '800',
  },

  uploadDescription: {
    color: '#927A87',
    fontSize: 12,
  },

  uploadButton: {
    backgroundColor: '#D879A1',
    padding: 15,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },

  uploadButtonBusy: {
    opacity: 0.6,
  },

  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sectionTitle: {
    color: '#604653',
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 17,
  },

  categoryContainer: {
    gap: 9,
    paddingBottom: 20,
  },

  categoryButton: {
    backgroundColor: '#F5E7EE',
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 25,
  },

  categoryActive: {
    backgroundColor: '#D879A1',
  },

  categoryText: {
    color: '#97687E',
    fontSize: 11,
    fontWeight: '700',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  catalogTitle: {
    color: '#604653',
    fontWeight: '800',
    fontSize: 17,
  },

  catalogCount: {
    color: '#A88D9B',
    fontSize: 11,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    marginBottom: 5,
  },

  selectedCard: {
    borderColor: '#D879A1',
    borderWidth: 2,
  },

  productImage: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  productEmoji: {
    fontSize: 65,
  },

  clothingPhoto: {
    width: '100%',
    height: '100%',
  },

  customBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  customBadgeText: {
    color: '#B66487',
    fontSize: 8,
    fontWeight: '900',
  },

  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#D879A1',
    width: 25,
    height: 25,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  productInfo: {
    padding: 13,
  },

  productName: {
    color: '#604653',
    fontSize: 12,
    fontWeight: '800',
  },

  productCategory: {
    color: '#A48C98',
    fontSize: 10,
    marginTop: 5,
  },

  addText: {
    color: '#C36E94',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 13,
  },

  addedText: {
    color: '#66977B',
  },

  noticeBox: {
    marginTop: 20,
    backgroundColor: '#F9EAF1',
    padding: 15,
    borderRadius: 15,
  },

  noticeText: {
    color: '#A15D7E',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
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
