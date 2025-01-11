import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { dbOperations } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/styles/theme";
import DocumentForm from "@/components/DocumentForm";
import { cancelDocumentNotifications } from "@/utils/notifications";
import CustomAlert from "@/components/CustomAlert";

export default function DocumentDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!id) {
        Toast.show({
          type: "error",
          message: "Invalid document ID",
        });
        router.back();
        return;
      }
      fetchDocumentDetails();
    }, [id])
  );

  const fetchDocumentDetails = async () => {
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
        message: "Failed to load document details",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/(main)/documents/${id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!id) return;

      // Cancel any scheduled notifications for this document
      await cancelDocumentNotifications(id.toString());

      // Delete the document
      await dbOperations.deleteDocument(id.toString());

      Toast.show({
        type: "success",
        message: "Document deleted successfully",
      });
      router.back();
    } catch (error) {
      console.error("Error deleting document:", error);
      Toast.show({
        type: "error",
        message: "Failed to delete document",
      });
    } finally {
      setShowDeleteAlert(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg="white" hideHeader>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <ScreenWrapper bg="white" hideHeader>
      <DocumentForm
        document={document}
        mode="view"
        onBack={() => router.back()}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        onCancel={() => setShowDeleteAlert(false)}
        onConfirm={handleConfirmDelete}
      />
    </ScreenWrapper>
  );
}
