// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation icons
  "house.fill": "home",
  "chart.bar.fill": "bar-chart",
  "arrow.left.arrow.right": "swap-horiz",
  "brain.head.profile": "psychology",
  "newspaper.fill": "article",
  "person.fill": "person",
  // Action icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Trading icons
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  // Utility icons
  "gearshape.fill": "settings",
  "bell.fill": "notifications",
  "clock.fill": "schedule",
  "doc.text.fill": "description",
  "chart.line.uptrend.xyaxis": "show-chart",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "arrow.clockwise": "refresh",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "link": "link",
  "eurosign.circle.fill": "euro",
  "dollarsign.circle.fill": "attach-money",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name as string] || "help-outline";
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}
