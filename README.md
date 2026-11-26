# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Estado real del proyecto (Paso 4)

Implementado:

- Inicio con acceso a Crear avatar, Mi armario, Fashion Studio, Mis creaciones y Mi perfil.
- Creación de avatar a partir de una imagen local mediante el backend Express + FASHN AI.
- Selección de foto desde galería/archivos y desde cámara (permisos solicitados en móvil).
- Giro 90°, recorte centrado 3:4 y confirmación explícita de la fotografía antes de enviarla a la IA.
- Normalización de la imagen a JPEG con `expo-image-manipulator` antes del envío.
- Catálogo único compartido (`src/data/catalog.ts`) y estado compartido (`src/context/FashionContext.tsx`).
- Fashion Studio con selección de prendas, cabello, color y maquillaje.
- Guardado local con `@react-native-async-storage/async-storage`: foto reducida, avatar generado, historial de avatares, prendas propias, look actual y looks con nombre.
- Pantalla Mis creaciones para aplicar o borrar avatares y looks guardados, y borrar todos los datos.
- Firebase Auth con correo y contraseña, Firestore y Firebase Storage usando el JS SDK (compatible con Expo Go).
- Descarga automática de la nube al iniciar sesión, guardado incremental de cambios y botones manuales de subida/descarga. Si la cuenta no tiene datos en la nube, el estado local **no** se sube automáticamente: usa «SUBIR LOCALES» para decidirlo (evita mezclar datos de otra cuenta).
- Reglas de seguridad por usuario en `firestore.rules` y `storage.rules`.

Todavía NO implementado (no se simula):

- Cámara en vivo en navegador de escritorio: `launchCameraAsync` puede abrir el selector de archivos. Requiere `expo-camera` y build de desarrollo.
- Probador virtual con IA: las prendas seleccionadas no se dibujan sobre la imagen.
- Avatar 3D real y cambio de ángulos/poses.
- Copia de los avatares generados por IA a Storage: se guarda la URL del proveedor y puede caducar.
- Recuperación de contraseña, verificación de correo, App Check y Google/Apple Sign-In.
- Beauty Studio independiente, logros, insignias y publicación web.

Notas:

- Las prendas del catálogo son marcadores de posición con emoji, no fotos de prendas reales.
- El guardado local no está cifrado y depende del espacio del dispositivo; las fotos se reducen antes de guardarse.
- El resultado de IA depende de la calidad de la fotografía y del proveedor. El historial guarda la URL devuelta; si el proveedor la retira, la imagen puede dejar de verse.
- La clave de FASHN AI debe estar en `server/.env` (nunca en el frontend).
- La configuración web de Firebase va en `EXPO_PUBLIC_FIREBASE_*` (`.env.example`). Esa API key es pública; la protección real son las reglas. Copia `.env.example` a `.env`, rellena los valores y reinicia Expo.
- Las reglas incluidas son plantillas: revísalas antes de publicar. El plan gratuito de Firebase tiene límites que conviene consultar.

