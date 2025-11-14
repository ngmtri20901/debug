// Main artifact components and types
export { Artifact, artifactDefinitions } from "./artifact";
export type { ArtifactKind, UIArtifact } from "./artifact";

// Artifact sub-components
export { ArtifactMessages } from "./artifact-messages";
export { ArtifactActions } from "./artifact-actions";
export { ArtifactCloseButton } from "./artifact-close-button";
export { Suggestion } from "./suggestion";

// Document components
export { DocumentToolResult, DocumentToolCall } from "./document";
export { DocumentPreview } from "./document-preview";
export { DocumentSkeleton, InlineDocumentSkeleton } from "./document-skeleton";

// Editor and diff components
export { Editor } from "./text-editor";
export { DiffView } from "./diffview";

// Version and footer components
export { VersionFooter } from "./version-footer";

// Artifact creation and configuration
export { Artifact as ArtifactClass } from "./create-artifact";
export type {
  ArtifactActionContext,
  ArtifactToolbarContext,
  ArtifactToolbarItem
} from "./create-artifact";
