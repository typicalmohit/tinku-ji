import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Document, dbOperations } from "@/lib/database";
import * as FileSystem from "expo-file-system";
import { generateUUID } from "@/utils/common";
import { scheduleDocumentExpiryNotifications } from "@/utils/notifications";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import DocumentForm from "@/components/DocumentForm";
import { format } from "date-fns";

type DocumentWithNewFile = Document & {
  newFile?: {
    name: string;
    uri: string;
  };
};

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<DocumentWithNewFile | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      if (!id || !session?.user?.id) return;

      const docs = await dbOperations.getDocuments(session.user.id);
      const doc = docs.find((d) => d.id === id.toString());

      if (!doc) {
        throw new Error("Document not found");
      }

      setDocument(doc);
    } catch (error) {
      console.error("Error fetching document:", error);
      Toast.show({
        type: "error",
        message: "Failed to fetch document details",
      });
      router.back();
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && document) {
      setDocument({
        ...document,
        expiry_date: format(selectedDate, "yyyy-MM-dd"),
      });
    }
  };

  const onInputChange = (field: keyof Document | "newFile", value: any) => {
    setDocument((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    try {
      if (!document || !session?.user?.id) return;
      setLoading(true);

      // If a new file is selected
      if (document.newFile) {
        // Create documents directory if it doesn't exist
        const documentsDir = `${FileSystem.documentDirectory}documents/`;
        const dirInfo = await FileSystem.getInfoAsync(documentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(documentsDir, {
            intermediates: true,
          });
        }

        // Generate a unique filename
        const fileExt = document.newFile.name.split(".").pop() || "";
        const uniqueFileName = `${Date.now()}_${generateUUID()}.${fileExt}`;
        const fileUri = `${documentsDir}${uniqueFileName}`;

        // Save new file
        await FileSystem.copyAsync({
          from: document.newFile.uri,
          to: fileUri,
        });

        // Delete old file
        try {
          await FileSystem.deleteAsync(document.file_path);
        } catch (error) {
          console.error("Error deleting old file:", error);
        }

        // Update file path
        document.file_path = fileUri;
      }

      // Remove temporary newFile property before saving
      const { newFile, ...docToSave } = document;

      await dbOperations.updateDocument(document.id, docToSave);

      // Reschedule notifications for the updated document
      await scheduleDocumentExpiryNotifications(docToSave);

      Toast.show({
        type: "success",
        message: "Document updated successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error updating document:", error);
      Toast.show({
        type: "error",
        message: "Failed to update document",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!document) {
    return null;
  }

  return (
    <ScreenWrapper bg="white" hideHeader>
      <DocumentForm
        document={document}
        mode="edit"
        onBack={() => router.back()}
        onSave={handleSave}
        onCancel={() => router.back()}
        loading={loading}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        onDateChange={onDateChange}
        onInputChange={onInputChange}
      />
    </ScreenWrapper>
  );
}
