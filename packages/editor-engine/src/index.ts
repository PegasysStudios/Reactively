export { createProjectCommand } from "./commands.js";

export {
  createProject,
  type CreateProjectOptions,
  type ProjectCreationContext,
} from "./create-project.js";

export type { ComponentDefaults, EditorCommandContext } from "./context.js";

export { editorError, type EditorError, type EditorErrorCode } from "./errors.js";

export {
  addNode,
  deleteNode,
  renameProject,
  reparentComponent,
  updateNodeProps,
  updateNodeStyle,
  type AddNodeParams,
  type DeleteNodeParams,
  type MutationResult,
  type RenameProjectParams,
  type ReparentComponentParams,
  type UpdateNodePropsParams,
  type UpdateNodeStyleParams,
} from "./operations.js";

export {
  getValidParentCandidates,
  type ParentCandidate,
  type ParentCandidateKind,
  type ValidParentCandidatesParams,
} from "./parent-candidates.js";

export type { ProjectPersistence, StoredProjectSummary } from "./ports/project-persistence.js";

export {
  DEFAULT_VIEWPORT,
  EMPTY_SELECTION,
  documentToViewport,
  viewportToDocument,
  type EditorPanel,
  type EditorViewport,
  type InspectorPanel,
  type SelectionState,
} from "./state.js";

export {
  collectSubtreeIds,
  getAncestorIds,
  getScreenRootIds,
  isAncestorOf,
  isNodeInScreenTree,
  isScreenRoot,
  isScreenTreeConsistent,
} from "./tree.js";
