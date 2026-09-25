import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'github-upload.zip')
const staging = path.join(
  process.env.TEMP || process.env.TMP || root,
  `typing-pet-gh-${Date.now()}`,
)

const includeDirs = [
  '.github',
  'build',
  'electron',
  'mac',
  'public',
  'scripts',
  'src',
]
const includeFiles = [
  '.gitignore',
  '.oxlintrc.json',
  'index.html',
  'settings.html',
  'package.json',
  'package-lock.json',
  'README.md',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
]
const skipDir = new Set([
  'node_modules',
  'release',
  'dist',
  'dist-electron',
  '.cache',
  'pet-user',
  '.git',
  '배포',
])

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipDir.has(entry.name)) continue
    if (/\.(exe|dmg|apk|zip|log)$/i.test(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

if (fs.existsSync(out)) fs.unlinkSync(out)
fs.mkdirSync(staging, { recursive: true })

try {
  for (const dir of includeDirs) {
    const src = path.join(root, dir)
    if (!fs.existsSync(src)) continue
    copyDir(src, path.join(staging, dir))
  }
  for (const file of includeFiles) {
    const src = path.join(root, file)
    if (!fs.existsSync(src)) continue
    fs.copyFileSync(src, path.join(staging, file))
  }

  // PowerShell Compress-Archive
  const ps = `
    Compress-Archive -Path (Join-Path -Path '${staging.replace(/'/g, "''")}' -ChildPath '*') -DestinationPath '${out.replace(/'/g, "''")}' -Force
  `
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
    { stdio: 'inherit' },
  )

  const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(2)
  console.log(`CREATED=${out}`)
  console.log(`SIZE_MB=${mb}`)
} finally {
  fs.rmSync(staging, { recursive: true, force: true })
}
