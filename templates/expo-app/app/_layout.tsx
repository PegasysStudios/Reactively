import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * REACTIVELY-OWNED FILE — regenerated from the project document. Do not edit.
 *
 * Root navigator. Expo Router requires `app/` at the project root and derives navigation
 * from this directory, so Reactively follows its conventions rather than forcing routes
 * into a theoretical folder tree. Screen implementations live in `src/generated/screens`;
 * the files under `app/` stay thin route declarations.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
