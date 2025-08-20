// This declaration silences IDE/module resolution warnings caused by backslashes
// in the auto-generated import within .sanity/runtime/app.js on Windows.
// It does not affect runtime behavior; it only informs the editor/TS language service
// that this module specifier exists and has a default export of any type.
declare module "../../sanity.config.js" {
  const config: any
  export default config
}

// Declare the remote Sanity bridge module used in dynamic import
// This prevents "Cannot resolve symbol 'https://core.sanity-cdn.com/bridge.js'" warnings in IDEs
declare module "https://core.sanity-cdn.com/bridge.js" {
  const bridge: any
  export default bridge
}
