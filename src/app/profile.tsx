import { useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { useFashion, type CloudStatus } from '../context/FashionContext';

const STATUS_LABEL: Record<CloudStatus, string> = {
  disabled: 'Firebase no configurado',
  'signed-out': 'Solo local · inicia sesión para sincronizar',
  syncing: 'Sincronizando...',
  synced: 'Sincronizado',
  error: 'Error de sincronización',
};

export default function ProfileScreen() {
  const {
    firebaseReady,
    authReady,
    user,
    authError,
    signUp,
    signIn,
    signOutUser,
  } = useAuth();

  const {
    cloudStatus,
    cloudMessage,
    lastSyncedAt,
    uploadLocalToCloud,
    downloadCloudToLocal,
    deleteCloudData,
  } = useFashion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmCloudDelete, setConfirmCloudDelete] = useState(false);

  const handleSignUp = async () => {
    setBusy(true);
    setNotice('');

    try {
      await signUp(email, password);
      setPassword('');
      setNotice('¡Cuenta creada! Tus datos se están sincronizando. ♡');
    } catch {
      setNotice('');
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async () => {
    setBusy(true);
    setNotice('');

    try {
      await signIn(email, password);
      setPassword('');
      setNotice('Sesión iniciada. ♡');
    } catch {
      setNotice('');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setNotice('');

    try {
      await signOutUser();
      setNotice('Sesión cerrada. Tus datos siguen guardados en este dispositivo.');
    } catch {
      setNotice('No pudimos cerrar la sesión.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloudDelete = () => {
    if (!confirmCloudDelete) {
      setConfirmCloudDelete(true);
      setNotice('Pulsa de nuevo para borrar tu copia en la nube.');
      return;
    }

    deleteCloudData();
    setConfirmCloudDelete(false);
    setNotice('Borrando tu copia en la nube...');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable>
          <Text style={styles.back}>← Volver al inicio</Text>
        </Pressable>
      </Link>

      <Text style={styles.eyebrow}>MY FASHION STUDIO ✦</Text>
      <Text style={styles.title}>Mi perfil</Text>
      <Text style={styles.description}>
        Con una cuenta puedes recuperar tus avatares y looks desde otro
        dispositivo. Sin cuenta, la app sigue funcionando en modo local.
      </Text>

      {!firebaseReady && (
        <View style={styles.setupBox}>
          <Text style={styles.setupTitle}>Firebase aún no está configurado</Text>
          <Text style={styles.setupText}>
            La nube está desactivada. Para activarla, crea un proyecto de
            Firebase, activa Authentication (correo y contraseña), Firestore y
            Storage, y añade estas variables a tu archivo `.env`:
          </Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_FIREBASE_API_KEY=...</Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...</Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_FIREBASE_PROJECT_ID=...</Text>
          <Text style={styles.envLine}>
            EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
          </Text>
          <Text style={styles.envLine}>
            EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
          </Text>
          <Text style={styles.envLine}>EXPO_PUBLIC_FIREBASE_APP_ID=...</Text>
          <Text style={styles.setupNote}>
            Reinicia Expo después de guardar el `.env`. La API key web de
            Firebase es pública; la protección real son las reglas de seguridad.
          </Text>
        </View>
      )}

      {!authReady && firebaseReady && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#D879A1" />
          <Text style={styles.loadingText}>Preparando tu sesión...</Text>
        </View>
      )}

      {firebaseReady && authReady && !user && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar o crear cuenta</Text>
          <Text style={styles.cardHint}>
            Usa un correo y una contraseña de al menos 6 caracteres.
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#B79DA9"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#B79DA9"
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={busy}
            >
              <Text style={styles.buttonText}>CREAR CUENTA</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.buttonSecondary, busy && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={busy}
            >
              <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
            </Pressable>
          </View>

          {authError !== null && authError !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
        </View>
      )}

      {firebaseReady && authReady && user && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu cuenta</Text>
            <Text style={styles.accountText}>{user.email ?? 'Sin correo'}</Text>
            <Text style={styles.accountId}>UID: {user.uid}</Text>

            <Pressable
              style={[styles.button, styles.buttonSecondary, styles.signOutButton]}
              onPress={handleSignOut}
              disabled={busy}
            >
              <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sincronización</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <Text
                style={[
                  styles.statusValue,
                  cloudStatus === 'error' && styles.statusError,
                  cloudStatus === 'synced' && styles.statusOk,
                ]}
              >
                {STATUS_LABEL[cloudStatus]}
              </Text>
            </View>

            {cloudMessage !== null && cloudMessage !== '' && (
              <Text style={styles.cloudMessage}>{cloudMessage}</Text>
            )}

            {lastSyncedAt && (
              <Text style={styles.lastSync}>
                Última sincronización: {lastSyncedAt.slice(0, 16).replace('T', ' ')}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <Pressable style={styles.button} onPress={uploadLocalToCloud}>
                <Text style={styles.buttonText}>SUBIR LOCALES</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={downloadCloudToLocal}
              >
                <Text style={styles.buttonText}>DESCARGAR NUBE</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, styles.dangerButton, styles.deleteButton]}
              onPress={handleCloudDelete}
            >
              <Text style={styles.buttonText}>
                {confirmCloudDelete
                  ? 'CONFIRMAR BORRADO EN LA NUBE'
                  : 'BORRAR DATOS EN LA NUBE'}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {notice !== '' && <Text style={styles.notice}>{notice}</Text>}

      <View style={styles.privacyBox}>
        <Text style={styles.privacyTitle}>Privacidad y costes</Text>
        <Text style={styles.privacyText}>
          • Firebase ofrece un plan gratuito limitado. Revisa sus límites antes
          de publicar la app.
        </Text>
        <Text style={styles.privacyText}>
          • Las fotos se suben a Firebase Storage; los looks y ajustes se
          guardan en Firestore.
        </Text>
        <Text style={styles.privacyText}>
          • Los avatares generados por IA se guardan como URL del proveedor. Si
          esa URL caduca, no podremos recuperarla.
        </Text>
        <Text style={styles.privacyText}>
          • No actives reglas de prueba en producción: cualquier persona podría
          leer o sobrescribir datos.
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
    maxWidth: 800,
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
  },
  setupBox: {
    backgroundColor: '#FCEFF4',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  setupTitle: {
    color: '#A15D7E',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  setupText: {
    color: '#8E7481',
    fontSize: 12,
    lineHeight: 19,
  },
  envLine: {
    color: '#6E5562',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 7,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  setupNote: {
    color: '#8E7481',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 14,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  loadingText: {
    color: '#927A87',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFE8',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  cardTitle: {
    color: '#604653',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardHint: {
    color: '#96838D',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9EAF1',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: '#604653',
    fontSize: 13,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  button: {
    backgroundColor: '#D879A1',
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 17,
  },
  buttonSecondary: {
    backgroundColor: '#A85F81',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  accountText: {
    color: '#604653',
    fontSize: 16,
    fontWeight: '700',
  },
  accountId: {
    color: '#B18D9F',
    fontSize: 10,
    marginTop: 6,
  },
  signOutButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statusLabel: {
    color: '#96838D',
    fontSize: 12,
  },
  statusValue: {
    color: '#A45E7D',
    fontSize: 12,
    fontWeight: '800',
  },
  statusOk: {
    color: '#6C9B7A',
  },
  statusError: {
    color: '#A52A2A',
  },
  cloudMessage: {
    color: '#8E7481',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 8,
  },
  lastSync: {
    color: '#B18D9F',
    fontSize: 10,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#A52A2A',
  },
  deleteButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  errorBox: {
    backgroundColor: '#FCE8E8',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  errorText: {
    color: '#A52A2A',
    fontSize: 11,
    lineHeight: 17,
  },
  notice: {
    color: '#6C9B7A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18,
  },
  privacyBox: {
    backgroundColor: '#F9EAF1',
    borderRadius: 18,
    padding: 20,
  },
  privacyTitle: {
    color: '#A15D7E',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  privacyText: {
    color: '#8E7481',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
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
