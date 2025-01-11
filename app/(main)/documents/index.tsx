import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/styles/theme";
import Toast from "@/components/Toast";
import { dbOperations } from "@/lib/database";
import DocumentCard from "@/components/DocumentCard";

const getFileType = (filePath: string): string => {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
};

export default function DocumentsScreen() {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "image" | "pdf" | "other"
  >("all");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;
      const docs = await dbOperations.getDocuments(session.user.id);
      setDocuments(docs || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      Toast.show({
        type: "error",
        message: "Failed to load documents",
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDocuments();
    }, [session?.user?.id])
  );

  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.comments &&
        doc.comments.toLowerCase().includes(searchQuery.toLowerCase()));

    // File type filter
    const fileType = getFileType(doc.file_path);
    const matchesFilter =
      selectedFilter === "all" || fileType === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <ScreenWrapper bg="#d9cec1" hideHeader>
      <TouchableWithoutFeedback
        onPress={() => {
          if (showSearch) {
            setShowSearch(false);
            setSearchQuery("");
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            {showSearch ? (
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.searchContainer}>
                  <MaterialIcons
                    name="search"
                    size={20}
                    color={theme.colors.textLight}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>Documents</Text>
                </View>
                <View style={styles.headerButtons}>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => setShowSearch(true)}
                  >
                    <MaterialIcons
                      name="search"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                  <Link href="/documents/new" asChild>
                    <Pressable style={styles.addButton}>
                      <MaterialIcons name="add" size={24} color="white" />
                      <Text style={styles.addButtonText}>Add New</Text>
                    </Pressable>
                  </Link>
                </View>
              </>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            <Pressable
              style={[
                styles.filterChip,
                selectedFilter === "all" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <MaterialIcons
                name="folder"
                size={16}
                color={
                  selectedFilter === "all" ? "white" : theme.colors.textDark
                }
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "all" && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterChip,
                selectedFilter === "image" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("image")}
            >
              <MaterialIcons
                name="image"
                size={16}
                color={
                  selectedFilter === "image" ? "white" : theme.colors.textDark
                }
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "image" && styles.filterTextActive,
                ]}
              >
                Images
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterChip,
                selectedFilter === "pdf" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("pdf")}
            >
              <MaterialIcons
                name="picture-as-pdf"
                size={16}
                color={
                  selectedFilter === "pdf" ? "white" : theme.colors.textDark
                }
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "pdf" && styles.filterTextActive,
                ]}
              >
                PDF
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterChip,
                selectedFilter === "other" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("other")}
            >
              <MaterialIcons
                name="more-horiz"
                size={16}
                color={
                  selectedFilter === "other" ? "white" : theme.colors.textDark
                }
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "other" && styles.filterTextActive,
                ]}
              >
                Others
              </Text>
            </Pressable>
          </ScrollView>

          <ScrollView style={styles.container}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : filteredDocuments.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No documents found</Text>
              </View>
            ) : (
              filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onRefresh={fetchDocuments}
                />
              ))
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.textDark,
  },
  filterContainer: {
    flexDirection: "row",
    maxHeight: 50,
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 3000,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    height: 32,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "white",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: "center",
  },
});
