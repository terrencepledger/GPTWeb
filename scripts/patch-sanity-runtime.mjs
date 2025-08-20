// Patch Sanity auto-generated runtime files to silence IDE warnings on Windows
// - Replace backslashes with forward slashes in import/specifier paths
// - Update <script src> path in index.html to use forward slashes
// - Remove obsolete type attribute from <style> in noscript block
// Safe to run after `sanity dev` generates .sanity/runtime files.

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runtimeDir = path.join(root, '.sanity', 'runtime')
const appJs = path.join(runtimeDir, 'app.js')
const indexHtml = path.join(runtimeDir, 'index.html')

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

function patchAppJs() {
  if (!exists(appJs)) return false
  const src = fs.readFileSync(appJs, 'utf8')
  // Replace Windows backslash import path with POSIX for editor resolution
  const patched = src.replace(
    /import\s+studioConfig\s+from\s+"\\.\\.\\\\\\.\\.\\\\sanity\.config\.js"/,
    'import studioConfig from "../../sanity.config.js"'
  )
  if (patched !== src) {
    fs.writeFileSync(appJs, patched, 'utf8')
    return true
  }
  return false
}

function patchIndexHtml() {
  if (!exists(indexHtml)) return false
  const src = fs.readFileSync(indexHtml, 'utf8')
  let out = src
  // Fix script src path backslashes to forward slashes
  out = out.replace(
    /<script\s+type="module"\s+src="\/\.sanity\\runtime\\app\.js"><\/script>/,
    '<script type="module" src="/.sanity/runtime/app.js"></script>'
  )
  // Remove obsolete type attribute on style tags in noscript content
  out = out.replace(/<style\s+type="text\/css">/g, '<style>')
  if (out !== src) {
    fs.writeFileSync(indexHtml, out, 'utf8')
    return true
  }
  return false
}

const changed = [patchAppJs(), patchIndexHtml()].some(Boolean)
if (changed) {
  console.log('Patched .sanity/runtime files for IDE compatibility.')
} else {
  console.log('No changes applied. Files either not found or already patched.')
}
