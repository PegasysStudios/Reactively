import type { PlatformSupport } from "@reactively/platform";
import type { ComponentStyle, NodeId, ScreenId } from "@reactively/project-schema";

/**
 * The React Native intermediate representation.
 *
 * The pipeline is:
 *
 *     ReactivelyProject -> validate -> normalize -> AppIR -> generated files
 *
 * The IR exists so that React Native implementation details can change — a different
 * routing library, a different runtime wrapper, a different file layout — without
 * touching the project schema that user documents are stored in. It is also the natural
 * place to resolve which dependencies an app actually needs.
 */

/** Bumped when the IR shape changes in a way generators must react to. */
export const APP_IR_VERSION = 1;

/** A dependency the generated app needs, and why. */
export interface DependencyIR {
  readonly name: string;
  readonly version: string;
  /** Human-readable justification, e.g. "Screen uses safe area". */
  readonly reason: string;
}

/** A single component in a screen's tree, flattened to what the generator emits. */
export interface ComponentIR {
  readonly nodeId: NodeId;
  /** Reactively project component type, e.g. `Button`. */
  readonly sourceType: string;
  /** Runtime wrapper to emit, e.g. `VNButton`. */
  readonly runtimeComponent: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style: ComponentStyle;
  readonly children: readonly ComponentIR[];
}

export interface ScreenIR {
  readonly screenId: ScreenId;
  readonly name: string;
  /** Generated React component name, e.g. `HomeScreen`. */
  readonly componentName: string;
  readonly safeArea: boolean;
  readonly scrollBehavior: "none" | "vertical" | "horizontal";
  readonly root: ComponentIR;
}

export interface RouteIR {
  readonly screenId: ScreenId;
  /** Application route as authored by the user, e.g. `/profile/[userId]`. */
  readonly route: string;
  /** Expo Router file this route compiles to, e.g. `app/profile/[userId].tsx`. */
  readonly filePath: string;
  readonly isInitial: boolean;
}

export interface AppIR {
  readonly irVersion: number;
  readonly app: {
    readonly name: string;
    readonly slug: string;
    readonly version: string;
    readonly runtimeVersion: string;
    readonly expoSdkVersion: string;
    readonly templateVersion: string;
    readonly initialRoute: string;
  };
  readonly routes: readonly RouteIR[];
  readonly screens: readonly ScreenIR[];
  readonly dependencies: readonly DependencyIR[];
  /** Weakest common platform support across everything the app uses. */
  readonly platformSupport: PlatformSupport;
}
