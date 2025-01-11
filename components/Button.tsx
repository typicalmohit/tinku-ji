import React from "react";
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { theme } from "@/styles/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  buttonStyle,
  textStyle,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.darkLight;
    switch (variant) {
      case "secondary":
        return "transparent";
      case "danger":
        return "#EF4444";
      default:
        return theme.colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.darkLight;
    switch (variant) {
      case "secondary":
        return theme.colors.primary;
      case "danger":
        return "#EF4444";
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textLight;
    switch (variant) {
      case "secondary":
        return theme.colors.primary;
      case "danger":
      default:
        return theme.colors.background;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        disabled && styles.disabled,
        buttonStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : theme.colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: getTextColor(),
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
