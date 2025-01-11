import { StyleSheet } from "react-native";
import { theme } from "@/styles/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingRight: 30,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
    backgroundColor: "white",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginLeft: 12,
  },
  backButton: {
    padding: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.textDark,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: "center",
    maxWidth: "80%",
  },
});
