import { Text, type StyleProp, type TextStyle } from "react-native";

/**
 * Text.
 *
 * Content is a prop rather than children: in Reactively, Text is a leaf whose content is
 * edited in the inspector, so generated code passes a string instead of a nested tree.
 */
export interface VNTextProps {
  content: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  testID?: string;
  accessibilityLabel?: string;
}

export function VNText({ content, style, numberOfLines, testID, accessibilityLabel }: VNTextProps) {
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </Text>
  );
}
