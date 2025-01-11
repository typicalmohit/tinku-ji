import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDatabase } from "@/lib/database";
import Toast from "@/components/Toast";

export default function RootLayout() {
  useEffect(() => {
    const initApp = async () => {
      try {
        await initDatabase();
        console.log("Database initialized at app startup");
      } catch (error) {
        console.error("Error initializing database:", error);
        Toast.show({
          type: "error",
          message: "Failed to initialize app",
        });
      }
    };
    initApp();
  }, []);

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
