import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { theme } from "@/styles/theme";
import Button from "@/components/Button";
import Toast from "@/components/Toast";
import { dbOperations } from "@/lib/database";
import { generateUUID } from "@/utils/common";
import { scheduleDocumentExpiryNotifications } from "@/utils/notifications";

interface SelectedFile {
  name: string;
  uri: string;
  type: string;
}

export default function NewDocumentScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [customName, setCustomName] = useState("");
  const [comments, setComments] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getFileType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "other";
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Check file size (limit to 5MB)
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (fileInfo.exists && fileInfo.size > 5 * 1024 * 1024) {
          Toast.show({
            type: "error",
            message: "File size should be less than 5MB",
          });
          return;
        }

        setSelectedFile({
          name: file.name,
          uri: file.uri,
          type: getFileType(file.name),
        });
        // Set default custom name as file name without extension
        setCustomName(file.name.split(".")[0]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Toast.show({
        type: "error",
        message: "Failed to pick document",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !session?.user?.id) {
      Toast.show({
        type: "error",
        message: "Please select a document",
      });
      return;
    }

    if (!customName.trim()) {
      Toast.show({
        type: "error",
        message: "Please enter a document name",
      });
      return;
    }

    try {
      setLoading(true);

      // Create documents directory if it doesn't exist
      const documentsDir = `${FileSystem.documentDirectory}documents/`;
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, {
          intermediates: true,
        });
      }

      // Generate a unique filename
      const fileExt = selectedFile.name.split(".").pop() || "";
      const uniqueFileName = `${Date.now()}_${generateUUID()}.${fileExt}`;
      const fileUri = `${documentsDir}${uniqueFileName}`;

      // Save file to app directory
      await FileSystem.copyAsync({
        from: selectedFile.uri,
        to: fileUri,
      });

      const newDocument = {
        id: generateUUID(),
        user_id: session.user.id,
        name: customName.trim(),
        file_path: fileUri,
        file_type: selectedFile.type,
        expiry_date: format(expiryDate, "yyyy-MM-dd"),
        comments: comments.trim() || null,
        created_at: new Date().toISOString(),
      };

      // Save document info to database
      await dbOperations.createDocument(newDocument);

      // Schedule notifications for the document
      await scheduleDocumentExpiryNotifications(newDocument);

      Toast.show({
        type: "success",
        message: "Document saved successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error saving document:", error);
      Toast.show({
        type: "error",
        message: "Failed to save document",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <MaterialIcons
              name="close"
              size={24}
              color={theme.colors.textDark}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Add Document</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Pressable style={styles.uploadButton} onPress={pickDocument}>
          <MaterialIcons
            name={selectedFile ? "check-circle" : "cloud-upload"}
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : "Select Document"}
          </Text>
          <Text style={styles.uploadSubtext}>
            Supported formats: PNG, JPG, JPEG, PDF (Max 5MB)
          </Text>
        </Pressable>

        {selectedFile && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Name</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Enter document name"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Comments</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={comments}
                onChangeText={setComments}
                placeholder="Add any additional information"
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Expiry Date</Text>
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons
              name="event"
              size={24}
              color={theme.colors.textLight}
            />
            <Text style={styles.dateText}>
              {format(expiryDate, "dd/MM/yyyy")}
            </Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setExpiryDate(date);
            }}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title="Save Document"
          onPress={handleSave}
          loading={loading}
          disabled={loading || !selectedFile}
          buttonStyle={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textDark,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.textDark,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dateContainer: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textDark,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.darkLight,
  },
  saveButton: {
    width: "100%",
  },
});
