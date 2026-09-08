import { getComponentDefinition } from "@reactively/component-registry";
import { intersectSupport, universalSupport, type PlatformSupport } from "@reactively/platform";
import {
  CURRENT_TEMPLATE_VERSION,
  type ComponentNode,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { validateProject, type ValidationIssue } from "@reactively/validation";

import { APP_IR_VERSION, type AppIR, type ComponentIR, type RouteIR, type ScreenIR } from "./ir.js";
import { routeToExpoRouterPath, screenComponentName } from "./routes.js";

/** Compilation stops at the first stage that cannot proceed. */
export type CompileResult =
  | { readonly status: "ok"; readonly appIr: AppIR }
  | { readonly status: "invalid-project"; readonly issues: readonly ValidationIssue[] };

/**
 * Normalizes a validated project into the React Native IR.
 *
 * Deterministic by construction: screens are emitted in route order and children follow
 * the document's own ordering, so the same project always produces the same IR and a
 * one-property edit produces a small diff.
 */
export function compileProjectToAppIR(project: ReactivelyProject): CompileResult {
  const validation = validateProject(project);
  if (!validation.valid) {
    return { status: "invalid-project", issues: validation.errors };
  }

  const screens = Object.values(project.screens).sort((left, right) =>
    left.route.localeCompare(right.route),
  );

  const screenIrs: ScreenIR[] = [];
  const routes: RouteIR[] = [];
  const componentSupports: PlatformSupport[] = [];

  for (const screen of screens) {
    const rootNode = project.nodes[screen.rootNodeId];
    if (!rootNode) {
      // Unreachable: validation rejects screens without a root node.
      continue;
    }

    screenIrs.push({
      screenId: screen.id,
      name: screen.name,
      componentName: screenComponentName(screen.name),
      safeArea: screen.options.safeArea,
      scrollBehavior: screen.options.scrollBehavior,
      root: buildComponentIR(project, rootNode, componentSupports),
    });

    routes.push({
      screenId: screen.id,
      route: screen.route,
      filePath: routeToExpoRouterPath(screen.route),
      isInitial: screen.id === project.initialScreenId,
    });
  }

  const initialScreen = project.screens[project.initialScreenId];

  return {
    status: "ok",
    appIr: {
      irVersion: APP_IR_VERSION,
      app: {
        name: project.settings.displayName,
        slug: project.settings.slug,
        version: project.settings.version,
        runtimeVersion: project.runtimeVersion,
        expoSdkVersion: project.expoSdkVersion,
        templateVersion: CURRENT_TEMPLATE_VERSION,
        initialRoute: initialScreen?.route ?? "/",
      },
      routes,
      screens: screenIrs,
      dependencies: resolveDependencies(screenIrs),
      platformSupport:
        componentSupports.length > 0 ? intersectSupport(componentSupports) : universalSupport(),
    },
  };
}

function buildComponentIR(
  project: ReactivelyProject,
  node: ComponentNode,
  collectedSupports: PlatformSupport[],
): ComponentIR {
  const definition = getComponentDefinition(node.type);
  if (definition) {
    collectedSupports.push(definition.platformSupport);
  }

  const children = node.children
    .map((childId) => project.nodes[childId])
    .filter((child): child is ComponentNode => child !== undefined)
    .map((child) => buildComponentIR(project, child, collectedSupports));

  return {
    nodeId: node.id,
    sourceType: node.type,
    // Validation guarantees the type is known, so the fallback is defensive only.
    runtimeComponent: definition?.generation.runtimeComponent ?? node.type,
    props: node.props,
    style: node.style,
    children,
  };
}

/**
 * Resolves the dependency set a generated app actually needs.
 *
 * Dependencies are earned, not assumed: the template ships a deliberately small baseline
 * and features add to it. Today only safe-area handling is feature-driven; state
 * management, forms and data fetching will follow the same rule when those features land.
 */
function resolveDependencies(screens: readonly ScreenIR[]) {
  const dependencies = [];

  if (screens.some((screen) => screen.safeArea)) {
    dependencies.push({
      name: "react-native-safe-area-context",
      version: "5.9.1",
      reason: "At least one screen renders inside a safe-area boundary.",
    });
  }

  return dependencies;
}
