import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * This component is used to wrap animated views that should only be animated on native.
 * @param props - The props for the animated view.
 * @returns The animated view if the platform is native, otherwise the children.
 * @example
 * <NativeOnlyAnimatedView entering={FadeIn} exiting={FadeOut}>
 *   <Text>I am only animated on native</Text>
 * </NativeOnlyAnimatedView>
 */
// Type-cast op React.ComponentProps van Animated.View → any om ref-mismatch
// tussen react-native-reanimated 4.x en RNR's original component-template te
// omzeilen. Runtime werkt correct; alleen TS ref-inferentie klaagt.
function NativeOnlyAnimatedView(props: any) {
  if (Platform.OS === 'web') {
    return <>{props.children as React.ReactNode}</>;
  } else {
    return <Animated.View {...props} />;
  }
}

export { NativeOnlyAnimatedView };
