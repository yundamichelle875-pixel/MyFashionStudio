
import { Link } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 760;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* BARRA SUPERIOR */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.logo}>MY FASHION</Text>
          <Text style={styles.logoSub}>STUDIO ✦</Text>
        </View>

        <View style={styles.navLabel}>
          <Text style={styles.navText}>YOUR PERSONAL STYLE WORLD</Text>
        </View>
      </View>

      {/* PRESENTACIÓN */}
      <View
        style={[
          styles.hero,
          {
            flexDirection: isDesktop ? 'row' : 'column',
          },
        ]}
      >
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>
            ✦ TU PROPIO UNIVERSO DE MODA
          </Text>

          <Text style={styles.title}>
            Tu estilo,{'\n'}
            <Text style={styles.titlePink}>tus reglas.</Text>
          </Text>

          <Text style={styles.description}>
            Crea tu propio avatar, experimenta con diferentes
            estilos y descubre todas las posibilidades de la moda.
            Aquí tu imaginación es la protagonista.
          </Text>

          <Link href="/create-avatar" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                CREAR MI AVATAR ✨
              </Text>
            </Pressable>
          </Link>

          <Text style={styles.note}>
            Tu imagen. Tu creatividad. Tu mundo.
          </Text>
        </View>

        {/* TARJETA VISUAL */}
        <View style={styles.avatarCard}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>YOUR NEW LOOK</Text>
            <Text style={styles.sparkle}>✧</Text>
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👩🏻‍🎤</Text>
          </View>

          <Text style={styles.avatarTitle}>Your fashion era</Text>
          <Text style={styles.avatarDescription}>
            Every look tells a story.
          </Text>

          <View style={styles.pills}>
            <Text style={styles.pill}>STYLE</Text>
            <Text style={styles.pill}>BEAUTY</Text>
            <Text style={styles.pill}>YOU</Text>
          </View>
        </View>
      </View>

      {/* SECCIONES */}
      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>EXPLORE YOUR WORLD</Text>
        <Text style={styles.sectionTitle}>¿Qué quieres hacer hoy?</Text>

        <View
          style={[
            styles.grid,
            {
              flexDirection: isDesktop ? 'row' : 'column',
            },
          ]}
        >
          <Link href="/create-avatar" asChild>
            <Pressable style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🪞</Text>
              <Text style={styles.featureTitle}>Crear avatar</Text>
              <Text style={styles.featureDescription}>
                Transforma una fotografía en tu personaje virtual.
              </Text>
              <Text style={styles.cardAction}>EMPEZAR →</Text>
            </Pressable>
          </Link>

          <Link href="/wardrobe" asChild>
            <Pressable style={styles.featureCard}>
              <Text style={styles.featureEmoji}>👗</Text>
              <Text style={styles.featureTitle}>Mi armario</Text>
              <Text style={styles.featureDescription}>
                Descubre prendas, zapatos y accesorios.
              </Text>
              <Text style={styles.cardAction}>EXPLORAR →</Text>
            </Pressable>
          </Link>

          <Link href="/fashion-studio" asChild>
            <Pressable style={styles.featureCard}>
              <Text style={styles.featureEmoji}>✨</Text>
              <Text style={styles.featureTitle}>Fashion Studio</Text>
              <Text style={styles.featureDescription}>
                Reúne tu avatar, tus prendas y tus elecciones de belleza.
              </Text>
              <Text style={styles.cardAction}>ABRIR EDITOR →</Text>
            </Pressable>
          </Link>

          <Link href="/my-creations" asChild>
            <Pressable style={styles.featureCard}>
              <Text style={styles.featureEmoji}>♡</Text>
              <Text style={styles.featureTitle}>Mis creaciones</Text>
              <Text style={styles.featureDescription}>
                Recupera tus avatares y looks guardados en este dispositivo.
              </Text>
              <Text style={styles.cardAction}>VER GUARDADOS →</Text>
            </Pressable>
          </Link>

          <Link href="/profile" asChild>
            <Pressable style={styles.featureCard}>
              <Text style={styles.featureEmoji}>♛</Text>
              <Text style={styles.featureTitle}>Mi perfil</Text>
              <Text style={styles.featureDescription}>
                Crea tu cuenta y sincroniza tus creaciones entre dispositivos.
              </Text>
              <Text style={styles.cardAction}>CONFIGURAR →</Text>
            </Pressable>
          </Link>

          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>💄</Text>
            <Text style={styles.featureTitle}>Beauty Studio</Text>
            <Text style={styles.featureDescription}>
              Estudio de maquillaje independiente.
            </Text>
            <Text style={styles.comingSoon}>PRÓXIMAMENTE</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MY FASHION STUDIO ✦ CREATE YOUR OWN BEAUTY
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
    paddingHorizontal: '6%',
    paddingTop: 30,
    paddingBottom: 45,
    maxWidth: 1250,
    width: '100%',
    alignSelf: 'center',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderColor: '#F2DDE7',
  },
  logo: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#604653',
  },
  logoSub: {
    fontSize: 12,
    letterSpacing: 5,
    color: '#D4779E',
    fontWeight: '700',
  },
  navLabel: {
    backgroundColor: '#F9E8F0',
    padding: 10,
    borderRadius: 20,
  },
  navText: {
    color: '#A55E7D',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 35,
    paddingVertical: 55,
  },
  heroText: {
    flex: 1,
    width: '100%',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#BF7293',
    fontWeight: '800',
    marginBottom: 15,
  },
  title: {
    fontSize: 55,
    lineHeight: 65,
    fontWeight: '800',
    color: '#543D49',
  },
  titlePink: {
    color: '#D879A1',
  },
  description: {
    color: '#806E78',
    fontSize: 15,
    lineHeight: 25,
    maxWidth: 480,
    marginTop: 18,
    marginBottom: 25,
  },
  primaryButton: {
    backgroundColor: '#D879A1',
    paddingVertical: 17,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  note: {
    color: '#A38D98',
    fontSize: 11,
    marginTop: 15,
  },
  avatarCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#F8E7EF',
    padding: 25,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EED3E0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardLabel: {
    color: '#A56D85',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  sparkle: {
    fontSize: 23,
    color: '#C87599',
  },
  avatarCircle: {
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: '#F2D3E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  avatarEmoji: {
    fontSize: 105,
  },
  avatarTitle: {
    color: '#644B58',
    fontWeight: '800',
    fontSize: 21,
  },
  avatarDescription: {
    color: '#977A88',
    marginTop: 7,
    fontSize: 12,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  pill: {
    color: '#A65F7E',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 15,
    fontSize: 9,
    fontWeight: '800',
  },
  section: {
    paddingTop: 25,
  },
  sectionEyebrow: {
    color: '#C27696',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#604653',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 22,
  },
  grid: {
    gap: 15,
  },
  featureCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1DFE8',
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#604653',
  },
  featureDescription: {
    color: '#96838D',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
    marginBottom: 18,
  },
  cardAction: {
    color: '#CA7196',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  comingSoon: {
    color: '#B79BA9',
    fontSize: 9,
    fontWeight: '800',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#F2DDE7',
    marginTop: 50,
    paddingTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#AE91A0',
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
  },
});
