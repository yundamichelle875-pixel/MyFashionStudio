import { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import { useFashion } from '../context/FashionContext';

function shortDate(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export default function MyCreationsScreen() {
  const {
    isHydrated,
    storageError,
    generatedAvatar,
    avatarHistory,
    selectAvatar,
    deleteAvatar,
    savedLooks,
    loadLook,
    deleteLook,
    clearLocalData,
  } = useFashion();

  const [notice, setNotice] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setNotice('Pulsa de nuevo para confirmar el borrado local.');
      return;
    }

    clearLocalData();
    setConfirmClear(false);
    setNotice(
      'Se borraron tus avatares, prendas y looks del dispositivo y de la nube, si había sesión iniciada.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable>
          <Text style={styles.back}>← Volver al inicio</Text>
        </Pressable>
      </Link>

      <Text style={styles.eyebrow}>MY FASHION STUDIO ✦</Text>
      <Text style={styles.title}>Mis creaciones</Text>
      <Text style={styles.description}>
        Todo lo que guardas se conserva en este dispositivo. Todavía no hay
        cuenta ni sincronización entre dispositivos.
      </Text>

      {!isHydrated && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#D879A1" />
          <Text style={styles.loadingText}>Restaurando tus creaciones...</Text>
        </View>
      )}

      {storageError !== '' && storageError !== null && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{storageError}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Avatares guardados</Text>
          <Text style={styles.sectionCount}>{avatarHistory.length}</Text>
        </View>

        {avatarHistory.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🪞</Text>
            <Text style={styles.emptyTitle}>Todavía no hay avatares guardados</Text>
            <Text style={styles.emptyText}>
              Cuando generes un avatar, aparecerá aquí para que puedas volver a
              usarlo.
            </Text>
          </View>
        ) : (
          <View style={styles.cardRow}>
            {avatarHistory.map((avatar) => {
              const active = generatedAvatar === avatar.uri;

              return (
                <View key={avatar.id} style={styles.avatarCard}>
                  <Image
                    source={{ uri: avatar.uri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.cardDate}>{shortDate(avatar.createdAt)}</Text>

                  <View style={styles.buttonRow}>
                    <Pressable
                      style={[styles.miniButton, active && styles.miniActive]}
                      onPress={() => selectAvatar(avatar.id)}
                      disabled={active}
                    >
                      <Text style={styles.miniButtonText}>
                        {active ? 'EN USO' : 'USAR'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.miniButton, styles.miniDanger]}
                      onPress={() => deleteAvatar(avatar.id)}
                    >
                      <Text style={styles.miniButtonText}>QUITAR</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis looks guardados</Text>
          <Text style={styles.sectionCount}>{savedLooks.length}</Text>
        </View>

        {savedLooks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>👗</Text>
            <Text style={styles.emptyTitle}>Todavía no hay looks guardados</Text>
            <Text style={styles.emptyText}>
              Guarda una combinación desde Fashion Studio y aparecerá aquí.
            </Text>
          </View>
        ) : (
          savedLooks.map((look) => (
            <View key={look.id} style={styles.lookCard}>
              <View style={styles.lookHeader}>
                <Text style={styles.lookName}>{look.name}</Text>
                <Text style={styles.cardDate}>{shortDate(look.createdAt)}</Text>
              </View>

              <Text style={styles.lookDetails}>
                {look.items.length > 0
                  ? look.items.map((item) => item.name).join(' · ')
                  : 'Sin prendas'}
              </Text>
              <Text style={styles.lookDetails}>
                {look.hairStyle} · {look.hairColor} · {look.makeupStyle}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.miniButton}
                  onPress={() => loadLook(look.id)}
                >
                  <Text style={styles.miniButtonText}>APLICAR LOOK</Text>
                </Pressable>

                <Pressable
                  style={[styles.miniButton, styles.miniDanger]}
                  onPress={() => deleteLook(look.id)}
                >
                  <Text style={styles.miniButtonText}>ELIMINAR</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos locales</Text>
        <Text style={styles.privacyText}>
          El guardado local no está cifrado. No guardes fotografías de terceros
          sin su autorización. Si iniciaste sesión, este borrado también quita
          tu copia en Firebase.
        </Text>

        <Pressable
          style={[styles.clearButton, confirmClear && styles.clearConfirm]}
          onPress={handleClear}
        >
          <Text style={styles.clearButtonText}>
            {confirmClear
              ? 'CONFIRMAR BORRADO TOTAL'
              : 'BORRAR TODOS MIS DATOS LOCALES'}
          </Text>
        </Pressable>

        {notice !== '' && <Text style={styles.notice}>{notice}</Text>}
      </View>

      <Link href="/fashion-studio" asChild>
        <Pressable style={styles.openStudioButton}>
          <Text style={styles.openStudioText}>ABRIR FASHION STUDIO →</Text>
        </Pressable>
      </Link>

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
    maxWidth: 1000,
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
    marginBottom: 24,
    maxWidth: 650,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    color: '#927A87',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FCE8E8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  errorText: {
    color: '#A52A2A',
    fontSize: 11,
    lineHeight: 17,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#604653',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCount: {
    backgroundColor: '#F5E7EE',
    color: '#A45E7D',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 11,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    color: '#604653',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: '#96838D',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  avatarCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    borderRadius: 18,
    padding: 12,
  },
  avatarImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F2D3E1',
  },
  cardDate: {
    color: '#B18D9F',
    fontSize: 9,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  miniButton: {
    backgroundColor: '#F5E7EE',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  miniActive: {
    backgroundColor: '#6C9B7A',
  },
  miniDanger: {
    backgroundColor: '#FCE8E8',
  },
  miniButtonText: {
    color: '#A45E7D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lookCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  lookName: {
    color: '#604653',
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  lookDetails: {
    color: '#8E7481',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },
  privacyText: {
    color: '#8E7481',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#A85F81',
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  clearConfirm: {
    backgroundColor: '#A52A2A',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  notice: {
    color: '#6C9B7A',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
  },
  openStudioButton: {
    backgroundColor: '#D879A1',
    borderRadius: 28,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  openStudioText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
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
