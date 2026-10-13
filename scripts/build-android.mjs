import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = resolve(root, 'android')
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const result = spawnSync(gradle, ['assembleDebug'], { cwd: androidDir, stdio: 'inherit', shell: process.platform === 'win32' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
