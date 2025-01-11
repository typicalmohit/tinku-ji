import React from "react";
import { View, Text, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/styles/theme";
import { styles } from "@/styles/bookings";
import Toast from "@/components/Toast";

export const renderInput = (
  label: string,
  value: string,
  onChangeText: (text: string) => void,
  icon: keyof typeof MaterialIcons.glyphMap,
  placeholder: string,
  keyboardType: "default" | "numeric" = "default",
  inputProps?: any
) => {
  const handleTextChange = (text: string) => {
    if (keyboardType === "numeric") {
      // Allow empty string or valid numbers only
      if (text === "" || /^\d*\.?\d*$/.test(text)) {
        onChangeText(text);
      } else {
        Toast.show({
          type: "error",
          message: "Please enter a valid number",
        });
      }
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <MaterialIcons name={icon} size={18} color={theme.colors.textLight} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          inputProps?.multiline && {
            height: 100,
            textAlignVertical: "top",
            paddingTop: 12,
          },
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={handleTextChange}
        keyboardType={keyboardType}
        {...inputProps}
      />
    </View>
  );
};
