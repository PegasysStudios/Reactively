import { View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

/**
 * Layout container.
 *
 * A thin pass-through today. It exists as a wrapper so that a future cross-platform fix —
 * an Android elevation quirk, a web overflow difference — can be applied in one place
 * instead of being regenerated into every screen.
 */
export interface VNViewProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
}

export function VNView({ style, children, testID, accessibilityLabel }: VNViewProps) {
  return (
    <View style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}
