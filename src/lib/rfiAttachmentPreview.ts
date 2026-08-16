// Pure helpers for the RFI attachment local-preview UX (RfiResponseForm.tsx).
// No Storage/network calls here -- these only ever operate on File objects
// already selected in the browser, before submission.

export type PreviewKind = "image" | "other";

export interface PreviewItem {
  file: File;
  kind: PreviewKind;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function classifyPreview(file: File): PreviewKind {
  return IMAGE_TYPES.has(file.type) ? "image" : "other";
}

export function buildPreviewItems(files: File[]): PreviewItem[] {
  return files.map((file) => ({ file, kind: classifyPreview(file) }));
}

export function removeFileAt(files: File[], index: number): File[] {
  return files.filter((_, i) => i !== index);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Whether the required acknowledgment checkbox must be checked before
// submit is allowed to proceed -- true only when attachments are present.
// Re-derived (not merely trusted) server-side in respondToRfi.
export function requiresAttachmentAcknowledgment(fileCount: number): boolean {
  return fileCount > 0;
}

export function submitButtonLabel(fileCount: number): string {
  return fileCount > 0 ? "Submit Response & Publish Attachments" : "Post Response";
}
