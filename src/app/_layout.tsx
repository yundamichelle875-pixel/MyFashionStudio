
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { FashionProvider } from '../context/FashionContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <FashionProvider>
        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#FFF8FB',
            },
          }}
        />
      </FashionProvider>
    </AuthProvider>
  );
}
