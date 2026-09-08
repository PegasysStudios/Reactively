import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

/**
 * Button.
 *
 * Built from Pressable + Text rather than React Native's built-in `Button`, which cannot
 * be styled and renders as a completely different control on each platform — the editor
 * canvas could never show the truth about it.
 *
 * The style object Reactively produces mixes container and text properties (a designer
 * sets "background" and "label colour" on one component), so this wrapper splits them
 * back apart before handing them to Pressable and Text.
 */
export interface VNButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle & TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/** Text properties that must be applied to the label, not the pressable container. */
const TEXT_STYLE_KEYS = [
  "color",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontFamily",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "textTransform",
] as const;

function splitStyle(style: StyleProp<ViewStyle & TextStyle>): {
  container: ViewStyle;
  text: TextStyle;
} {
  const flattened = StyleSheet.flatten(style) ?? {};
  const container: Record<string, unknown> = {};
  const text: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flattened)) {
    if ((TEXT_STYLE_KEYS as readonly string[]).includes(key)) {
      text[key] = value;
    } else {
      container[key] = value;
    }
  }

  return { container: container as ViewStyle, text: text as TextStyle };
}

export function VNButton({
  label,
  disabled = false,
  onPress,
  onLongPress,
  style,
  testID,
  accessibilityLabel,
}: VNButtonProps) {
  const { container, text } = splitStyle(style);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        container,
        // Press feedback is normalized here so iOS, Android and web agree. Android's
        // native ripple would otherwise be the only platform showing anything.
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
