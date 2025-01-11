import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { format } from "date-fns";
import { theme } from "@/styles/theme";
import { Document } from "@/lib/database";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface DocumentCardProps {
  document: Document;
  onRefresh?: () => Promise<void>;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter();

  const getFileIcon = (fileUri: string) => {
    const ext = fileUri.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
    if (ext === "pdf") return "picture-as-pdf";
    return "insert-drive-file";
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/documents/${document.id}`)}
    >
      <View style={styles.previewContainer}>
        <MaterialIcons
          name={getFileIcon(document.file_path)}
          size={24}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {document.name}
        </Text>
        <Text style={styles.date}>
          Expires: {format(new Date(document.expiry_date), "dd/MM/yyyy")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 4,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  previewContainer: {
    width: 50,
    height: 50,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
});
