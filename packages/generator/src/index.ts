export { compileProjectToAppIR, type CompileResult } from "./compile.js";

export {
  DEFAULT_GENERATION_OPTIONS,
  generateProject,
  type FileOwnership,
  type GeneratedFile,
  type GenerationOptions,
  type GenerationResult,
  type GenerationStage,
} from "./generate.js";

export {
  APP_IR_VERSION,
  type AppIR,
  type ComponentIR,
  type DependencyIR,
  type RouteIR,
  type ScreenIR,
} from "./ir.js";

export { routeToExpoRouterPath, screenComponentName } from "./routes.js";
