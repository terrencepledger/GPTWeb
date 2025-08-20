// Minimal default document node resolver
export const defaultDocumentNode = (S: any) => {
  // For now, return the default form view for all types
  return S.document().views([S.view.form()])
}
