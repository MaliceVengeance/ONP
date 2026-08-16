// Pure rendering-rule helpers for Bid Information History (client + contractor
// views). Kept separate from the RPC/DB layer so the "what does a viewer of
// role X see for status Y" logic can be unit tested without a database.

export type AttachmentStatus = "ACTIVE" | "WITHDRAWN" | "SENSITIVE_REMOVAL_PENDING" | "SENSITIVE_REMOVED";
export type ViewerRole = "CLIENT" | "CONTRACTOR" | "ADMIN";

export interface HistoryDisplay {
  label: string;
  showDownloadLink: boolean;
  showFilename: boolean;
  showThumbnail: boolean;
  showReasonCategory: boolean;
  showClientFreeText: boolean;
}

// The single source of truth for "what can this role see for this status" --
// the contractor-facing RPC (029) independently nulls the underlying columns
// server-side too (defense in depth), but the UI still needs this logic to
// decide what to render from whatever it receives.
export function getHistoryDisplay(status: AttachmentStatus, viewer: ViewerRole, isAwardedContractor: boolean): HistoryDisplay {
  if (status === "SENSITIVE_REMOVAL_PENDING" || status === "SENSITIVE_REMOVED") {
    if (viewer === "CONTRACTOR") {
      return {
        label: "Removed for a privacy/safety concern",
        showDownloadLink: false,
        showFilename: false,
        showThumbnail: false,
        showReasonCategory: false,
        showClientFreeText: false,
      };
    }
    // CLIENT/ADMIN: full audit visibility.
    return {
      label: status === "SENSITIVE_REMOVAL_PENDING" ? "Sensitive removal in progress" : "Removed (sensitive)",
      showDownloadLink: false,
      showFilename: true,
      showThumbnail: false,
      showReasonCategory: true,
      showClientFreeText: viewer === "ADMIN",
    };
  }

  if (status === "WITHDRAWN") {
    return {
      label: "Withdrawn",
      showDownloadLink: true,
      showFilename: viewer !== "CONTRACTOR" || isAwardedContractor,
      showThumbnail: true,
      showReasonCategory: true,
      showClientFreeText: viewer !== "CONTRACTOR",
    };
  }

  // ACTIVE
  return {
    label: "Active",
    showDownloadLink: true,
    showFilename: viewer !== "CONTRACTOR" || isAwardedContractor,
    showThumbnail: true,
    showReasonCategory: false,
    showClientFreeText: false,
  };
}
