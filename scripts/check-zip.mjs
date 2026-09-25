import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const zip = 'D:\\타이핑펫\\github-upload.zip'
const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead('${zip.replace(/\\/g, '\\\\')}')
$z.Entries | ForEach-Object { $_.FullName }
$z.Dispose()
`
const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], {
  encoding: 'utf8',
})
const lines = out.split(/\r?\n/).filter(Boolean)
console.log('TOTAL', lines.length)
console.log(
  'WORKFLOW',
  lines.filter((l) => /github|workflow|build-mac/i.test(l)).join('\n') || 'MISSING',
)
