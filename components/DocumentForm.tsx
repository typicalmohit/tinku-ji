import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/styles/theme";
import Button from "@/components/Button";
import { Document } from "@/lib/database";
import { format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import Toast from "@/components/Toast";
import * as FileSystem from "expo-file-system";
import DocumentPreview from "@/components/DocumentPreview";

interface DocumentFormProps {
  document: Document & { newFile?: { name: string; uri: string } };
  mode: "view" | "edit";
  onBack: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  showDatePicker?: boolean;
  setShowDatePicker?: (show: boolean) => void;
  onDateChange?: (event: any, date?: Date) => void;
  onInputChange?: (field: keyof Document | "newFile", value: any) => void;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

export default function DocumentForm({
  document,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
  loading,
  showDatePicker,
  setShowDatePicker,
  onDateChange,
  onInputChange,
  onDelete,
  deleteLoading,
}: DocumentFormProps) {
  const getFileType = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "picture-as-pdf";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return "image";
    return "insert-drive-file";
  };

  const handlePickDocument = async () => {
    if (!onInputChange) return;

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

        onInputChange("newFile" as keyof Document | "newFile", {
          name: file.name,
          uri: file.uri,
        });
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Toast.show({
        type: "error",
        message: "Failed to pick document",
      });
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.closeButton} onPress={onBack}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.textDark}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {mode === "edit" ? "Edit Document" : "View Document"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {mode === "view" && (
            <Pressable onPress={onEdit} style={styles.iconButton}>
              <MaterialIcons
                name="edit"
                size={24}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
          {mode === "edit" && (
            <Pressable
              onPress={onDelete}
              style={styles.iconButton}
              disabled={deleteLoading}
            >
              <MaterialIcons name="delete" size={24} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {mode === "edit" ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Document File</Text>
              <Pressable
                style={styles.uploadButton}
                onPress={handlePickDocument}
              >
                <MaterialIcons
                  name={getFileType(document.newFile?.name || document.name)}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.uploadButtonText}>
                  {document.newFile?.name || document.name}
                </Text>
              </Pressable>
              <DocumentPreview
                fileUri={document.newFile?.uri || document.file_path}
                fileType={document.file_type}
                style={styles.preview}
                name={document.name}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Name</Text>
              <TextInput
                style={styles.input}
                value={document.name}
                onChangeText={(value) => onInputChange?.("name", value)}
                placeholder="Enter document name"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Comments</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={document.comments || ""}
                onChangeText={(value) => onInputChange?.("comments", value)}
                placeholder="Add any additional information"
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Expiry Date</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker?.(true)}
              >
                <MaterialIcons
                  name="event"
                  size={24}
                  color={theme.colors.textLight}
                />
                <Text style={styles.dateText}>
                  {format(new Date(document.expiry_date), "dd/MM/yyyy")}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && onDateChange && (
              <DateTimePicker
                value={new Date(document.expiry_date)}
                mode="date"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Document Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {document.file_type.charAt(0).toUpperCase() +
                    document.file_type.slice(1)}
                </Text>
              </View>
              <DocumentPreview
                fileUri={document.file_path}
                fileType={document.file_type}
                style={styles.preview}
                name={document.name}
              />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added On</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(document.created_at), "dd/MM/yyyy")}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expires On</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(document.expiry_date), "dd/MM/yyyy")}
                </Text>
              </View>
            </View>

            {document.comments && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Comments</Text>
                <Text style={styles.comments}>{document.comments}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {mode === "edit" ? (
          <>
            <Button
              title="Cancel"
              onPress={onCancel ?? (() => {})}
              variant="secondary"
              buttonStyle={styles.cancelButton}
            />
            <Button
              title="Save Changes"
              onPress={onSave ?? (() => {})}
              loading={loading}
              disabled={loading}
              buttonStyle={styles.saveButton}
            />
          </>
        ) : onDelete ? (
          <Button
            title="Delete Document"
            onPress={onDelete}
            loading={deleteLoading}
            disabled={deleteLoading}
            variant="danger"
            buttonStyle={styles.fullWidthButton}
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  documentPreview: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: 20,
    marginBottom: 24,
    gap: 16,
  },
  documentPreviewEdit: {
    borderStyle: "dashed",
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  documentName: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textDark,
    textAlign: "center",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textDark,
    textAlign: "center",
  },
  uploadSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  comments: {
    fontSize: 14,
    color: theme.colors.textDark,
    lineHeight: 20,
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
    borderRadius: 20,
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
    borderRadius: 20,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textDark,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.darkLight,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  preview: {
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: theme.colors.darkLight,
    borderRadius: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.textDark,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  deleteButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
});
