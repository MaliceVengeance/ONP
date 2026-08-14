// The "open-ended" RFI catalog item ("I have a specific question not
// covered above...") is exempt from the one-question-per-catalog-item-per-
// project rule -- it's meant to be askable multiple times. The stored
// prompt carries extra trailing text ("...not covered above. (Note: this
// will be reviewed by ONP admin before being posted.)"), so this must be a
// tolerant substring match, not exact equality -- an exact match never
// matches this text and silently defeats the exemption. Mirrors the same
// tolerant check the contractor RFI page already uses to identify this
// item for its dropdown.
export function isOpenEndedRfiPrompt(prompt: string | null | undefined): boolean {
  return prompt?.toLowerCase().includes("specific question not covered above") ?? false;
}
