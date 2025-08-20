
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import studioConfig from "../../sanity.config.js"
import {renderStudio} from "sanity"

// Ensure Sanity bridge is loaded (for dev overlay/HMR)
await import("https://core.sanity-cdn.com/bridge.js")

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: false, basePath: "/"}
)
