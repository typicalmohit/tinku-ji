import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { theme } from "@/styles/theme";
import { Menu } from "react-native-paper";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false }) => {
  const { signOut, userProfile } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    {
      label: "Profile",
      value: "profile",
      icon: "person",
      onPress: () => {
        setMenuVisible(false);
        router.push("/profile");
      },
    },
    {
      label: "Settings",
      value: "settings",
      icon: "settings",
      onPress: () => {
        setMenuVisible(false);
        router.push("/settings");
      },
    },
    {
      label: "Sign Out",
      value: "signout",
      icon: "logout",
      onPress: () => {
        setMenuVisible(false);
        signOut();
        router.push("/");
      },
    },
  ];

  const renderProfileButton = () => {
    return (
      <View style={styles.profileImageContainer}>
        <Image
          source={
            userProfile?.image
              ? { uri: userProfile.image }
              : require("../assets/images/default-user-image.png")
          }
          style={styles.profileImage}
          onError={(e) =>
            console.log("Image loading error:", e.nativeEvent.error)
          }
        />
      </View>
    );
  };

  return (
    <View style={[styles.header]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <View style={styles.leftSection}>
        <Pressable
          onPress={() => router.push("/(main)/(home)")}
          style={styles.iconButton}
        >
          <MaterialIcons name="home" size={28} color={theme.colors.primary} />
        </Pressable>
        {showBackButton && (
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={theme.colors.textDark}
            />
          </Pressable>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable onPress={() => setMenuVisible(true)}>
            {renderProfileButton()}
          </Pressable>
        }
        contentStyle={styles.menuContainer}
      >
        {menuItems.map((item) => (
          <Menu.Item
            key={item.value}
            onPress={item.onPress}
            title={item.label}
            titleStyle={{ color: theme.colors.textDark }}
            leadingIcon={() => (
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color={theme.colors.textDark}
              />
            )}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    marginRight: 12,
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  profileImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  menuContainer: {
    marginTop: 40,
    borderRadius: 20,
    paddingLeft: 10,
    backgroundColor: "#d9cec1",
    elevation: 5,
  },
});

export default Header;
