import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

const Home = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  useEffect(() => {
    console.log("[Home] Screen mounted");
    return () => {
      console.log("[Home] Screen unmounted");
    };
  }, []);

  useEffect(() => {
    if (!userProfile) {
      console.log("[Home] No user profile, showing loading state");
    } else {
      console.log("[Home] User profile loaded:", userProfile.name);
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <ScreenWrapper bg="white" hideHeader>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C26F" />
        </View>
      </ScreenWrapper>
    );
  }

  const handleNavigation = (route: string) => {
    console.log("[Home] Navigating to:", route);
    if (route === "bookings") {
      router.push({ pathname: "/(main)/bookings" } as any);
    } else if (route === "documents") {
      router.push({ pathname: "/(main)/documents" } as any);
    } else {
      alert("Coming Soon!");
    }
  };

  console.log("[Home] Rendering main content");
  return (
    <ScreenWrapper bg="#d9cec1" hideHeader>
      {/* Header with Avatar Menu */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Features</Text>
        <Text style={styles.welcomeTextRight}>{userProfile.name}</Text>
      </View>

      {/* Main Options */}
      <View style={styles.optionsContainer}>
        {/* Booking Tracker */}
        <Pressable
          style={styles.optionCard}
          onPress={() => handleNavigation("bookings")}
        >
          <MaterialIcons name="directions-bus" size={40} color="#00C26F" />
          <View>
            <Text style={styles.optionTitle} numberOfLines={2}>
              Booking Tracker
            </Text>
            <Text style={styles.optionDescription} numberOfLines={3}>
              Track and manage your transport bookings
            </Text>
          </View>
        </Pressable>

        {/* Document Storage */}
        <Pressable
          style={styles.optionCard}
          onPress={() => handleNavigation("documents")}
        >
          <MaterialIcons name="folder" size={40} color="#00C26F" />
          <View>
            <Text style={styles.optionTitle} numberOfLines={2}>
              Document Storage
            </Text>
            <Text style={styles.optionDescription} numberOfLines={3}>
              Store and manage your documents
            </Text>
          </View>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D1D1D",
  },
  welcomeTextRight: {
    fontSize: 14,
    fontWeight: "400",
    color: "#7C7C7C",
    alignSelf: "flex-end",
    marginLeft: "auto",
    marginRight: 16,
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  optionCard: {
    minHeight: 100,
    flexDirection: "row",
    gap: 16,
    padding: 20,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1D",
    marginTop: 8,
    flexShrink: 1,
  },
  optionDescription: {
    fontSize: 14,
    color: "#7C7C7C",
    marginTop: 4,
    flexShrink: 1,
  },
});

export default Home;
