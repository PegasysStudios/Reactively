import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/generated/theme";
import { VNButton, VNText, VNView } from "@/runtime";

/**
 * REACTIVELY-OWNED FILE — regenerated from the project document. Do not edit.
 *
 * This is the shape the generator emits for a screen: a safe-area boundary when the
 * screen requests one, then the component tree, then a single `StyleSheet.create` block
 * with one entry per node. Styles are named by node so that a one-property change in the
 * editor produces a one-line diff.
 *
 * To customise behaviour, put your code in `src/custom/` and reference it from the
 * project instead of editing this file.
 */
export function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <VNView style={styles.root} testID="node_root">
        <VNText content="Hello from Reactively" style={styles.title} testID="node_title" />
        <VNButton label="Get started" style={styles.cta} testID="node_cta" />
      </VNView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  root: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm + 4,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  cta: {
    width: 200,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    color: theme.colors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});
