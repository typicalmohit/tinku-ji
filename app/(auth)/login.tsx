import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmail, validatePassword } from "@/utils/validation";
import ScreenWrapper from "@/components/ScreenWrapper";
import Button from "@/components/Button";
import { theme } from "@/styles/theme";
import { authStyles as styles } from "@/styles/auth";
import Toast from "@/components/Toast";

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "mohit@k.com",
    password: "123456",
  });

  const handleLogin = async () => {
    if (
      !formData.email ||
      !validateEmail(formData.email) ||
      !formData.password ||
      !validatePassword(formData.password)
    ) {
      setError("Please check your input fields");
      return;
    }

    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      console.log("Starting login process...");

      await signIn(formData.email, formData.password);
      console.log("Login successful, navigating to home...");

      router.replace("/(main)/(home)");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    Toast.show({
      type: "error",
      message: error,
    });
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container as ViewStyle}>
        <Pressable
          style={styles.backButton as ViewStyle}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.textDark}
          />
        </Pressable>

        <View style={styles.headerContainer as ViewStyle}>
          <Text style={styles.title as TextStyle}>Welcome Back</Text>
          <Text style={styles.subtitle as TextStyle}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer as ViewStyle}>
          <View style={styles.inputContainer as ViewStyle}>
            <MaterialIcons
              name="mail"
              size={20}
              color={theme.colors.textLight}
            />
            <TextInput
              placeholder="Email"
              style={[styles.input as TextStyle, { includeFontPadding: false }]}
              placeholderTextColor={theme.colors.textLight}
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, email: text }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer as ViewStyle}>
            <MaterialIcons
              name="lock"
              size={20}
              color={theme.colors.textLight}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              style={[styles.input as TextStyle, { includeFontPadding: false }]}
              placeholderTextColor={theme.colors.textLight}
              value={formData.password}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, password: text }))
              }
              autoCapitalize="none"
            />
          </View>

          <Button
            title="Login"
            buttonStyle={styles.button as ViewStyle}
            textStyle={styles.buttonText as TextStyle}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={styles.footer as ViewStyle}>
          <Pressable onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.footerText as TextStyle}>
              Don't have an account?{" "}
              <Text style={styles.footerLink as TextStyle}>Sign Up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      <Toast position="bottom" />
    </ScreenWrapper>
  );
};

export default Login;
