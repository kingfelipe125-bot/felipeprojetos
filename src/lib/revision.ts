export function formatRevisionLabel(revisionNumber: number) {
  return `R${String(revisionNumber).padStart(2, "0")}`;
}
