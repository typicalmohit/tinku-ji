import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/styles/theme";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as WebBrowser from "expo-web-browser";
import Toast from "./Toast";

interface DocumentPreviewProps {
  fileUri: string;
  fileType: string;
  style?: any;
  mode?: "list" | "full";
  onPress?: () => void;
  name?: string;
}

export default function DocumentPreview({
  fileUri,
  fileType,
  style,
  mode = "full",
  onPress,
  name,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(false);
  const getFileExtension = (fileUri: string): string => {
    if (!fileUri) return "";

    const extParts = fileUri.split(".");
    return extParts.length > 1
      ? extParts[extParts.length - 1].toLowerCase()
      : "";
  };

  const isImage = ["jpg", "jpeg", "png", "gif"].includes(
    getFileExtension(fileUri).toLowerCase()
  );

  const getFileIcon = () => {
    const type = getFileExtension(fileUri).toLowerCase();
    if (type === "pdf") return "picture-as-pdf";
    if (["doc", "docx"].includes(type)) return "description";
    if (["xls", "xlsx"].includes(type)) return "table-chart";
    if (["jpg", "jpeg", "png", "gif"].includes(type)) return "image";
    return "insert-drive-file";
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }
    await handlePreview();
  };

  const openWithFallback = async (uri: string) => {
    try {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
        });
      } else {
        await WebBrowser.openBrowserAsync(uri);
      }
    } catch (error) {
      console.error("Error in fallback:", error);
      try {
        await Linking.openURL(uri);
      } catch (e) {
        Toast.show({
          type: "error",
          message: "Could not open file with any available method",
        });
      }
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        Toast.show({
          type: "error",
          message: "File not found",
        });
        return;
      }
      await openWithFallback(fileUri);
    } catch (error) {
      console.error("Error previewing document:", error);
      Toast.show({
        type: "error",
        message: "Failed to open document",
      });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "list") {
    return (
      <Pressable
        style={[styles.container, styles.listContainer, style]}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <MaterialIcons
            name={getFileIcon()}
            size={24}
            color={theme.colors.primary}
          />
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : isImage ? (
        <Pressable onPress={handlePreview} style={styles.imageContainer}>
          <Image
            source={{ uri: fileUri }}
            style={styles.image}
            resizeMode="contain"
            onError={() => {
              console.log("Image load error for:", fileUri);
              Toast.show({
                type: "error",
                message: "Failed to load image",
              });
            }}
          />
          <View style={styles.overlay}>
            <MaterialIcons
              name="zoom-in"
              size={32}
              color={theme.colors.background}
            />
          </View>
        </Pressable>
      ) : (
        <Pressable style={styles.fullPreview} onPress={handlePreview}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={getFileIcon()}
              size={64}
              color={theme.colors.primary}
            />
            {name && (
              <Text style={styles.fileName} numberOfLines={1}>
                {name}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.darkLight,
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 200,
  },
  listContainer: {
    width: 50,
    height: 50,
    backgroundColor: `${theme.colors.primary}15`,
  },
  listImage: {
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.darkLight,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.darkLight,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPreview: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: `${theme.colors.primary}10`,
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fileName: {
    marginTop: 8,
    fontSize: 18,
    color: theme.colors.textDark,
    fontWeight: "600",
    textAlign: "center",
  },
});
