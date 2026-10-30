import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mode = process.argv[2];

function fail(message) {
  console.error(`Android ${mode ?? 'build'}: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const isWindowsScript = process.platform === 'win32' && /\.(bat|cmd)$/i.test(command);
  const executable = isWindowsScript ? (process.env.ComSpec || 'cmd.exe') : command;
  const commandArgs = isWindowsScript ? ['/d', '/c', command, ...args] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) fail(`could not start ${command}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function localEnv() {
  const values = {};
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return values;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

function localBuildConfig() {
  const config = {};
  const configPath = resolve(root, '.android-build.env');
  if (!existsSync(configPath)) return config;
  for (const line of readFileSync(configPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !match[1].startsWith('#')) config[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return config;
}

function preflight() {
  const config = localBuildConfig();
  const requestedHome = process.env.DOTI_JDK_HOME || config.DOTI_JDK_HOME;
  const javaHome = requestedHome || process.env.JAVA_HOME;
  if (!javaHome || !existsSync(resolve(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
    fail('JDK not found. Set DOTI_JDK_HOME in .android-build.env or configure JAVA_HOME with JDK 21 or 25.');
  }
  const java = resolve(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const version = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const versionText = `${version.stdout || ''}\n${version.stderr || ''}`;
  const major = Number(versionText.match(/version "(?:1\.)?(\d+)/)?.[1]);
  if (version.status !== 0 || ![21, 25].includes(major)) fail(`Doti Android builds require JDK 21 or 25. Detected Java ${major || 'unknown'} at the selected JDK path.`);
  process.env.JAVA_HOME = resolve(javaHome);
  process.env.PATH = `${resolve(javaHome, 'bin')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`;

  const localProperties = resolve(root, 'android/local.properties');
  const sdkLine = existsSync(localProperties) ? readFileSync(localProperties, 'utf8').match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m)?.[1]?.replaceAll('\\:', ':') : null;
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || sdkLine || resolve(process.env.LOCALAPPDATA || '', 'Android/Sdk');
  if (!existsSync(sdk)) fail(`Android SDK was not found at ${sdk}. Set ANDROID_SDK_ROOT or configure android/local.properties.`);
  if (!existsSync(resolve(sdk, 'platforms', 'android-36'))) fail(`Android SDK Platform 36 not found. Configure ANDROID_SDK_ROOT or android/local.properties (checked ${sdk}).`);
  const buildTools = resolve(sdk, 'build-tools');
  const hasRequiredTools = (version) => existsSync(resolve(buildTools, version, process.platform === 'win32' ? 'aapt.exe' : 'aapt'))
    && existsSync(resolve(buildTools, version, process.platform === 'win32' ? 'apksigner.bat' : 'apksigner'));
  if (!existsSync(buildTools) || !readdirSync(buildTools, { withFileTypes: true }).some((entry) => entry.isDirectory() && hasRequiredTools(entry.name))) {
    fail('Android SDK Build-Tools with apksigner and aapt are required. Install them with SDK Manager.');
  }
  process.env.ANDROID_SDK_ROOT ||= sdk;
  process.env.ANDROID_HOME ||= sdk;
}

if (!['debug', 'release'].includes(mode)) fail('usage: node scripts/android-release.mjs <debug|release>');

preflight();

const env = localEnv();
const publicConfig = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
for (const name of mode === 'release' ? publicConfig : []) {
  const value = process.env[name] || env[name];
  if (!value || value.includes('your-project') || value.includes('your-public-anon-key')) {
    fail(`set ${name} in .env or the environment before building; its value is never printed.`);
  }
}
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
if (anonKey) {
  if (/^(sb_secret_|service_role)/i.test(anonKey)) fail('VITE_SUPABASE_ANON_KEY must be a public anon/publishable key, not a privileged key.');
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (payload.role === 'service_role') fail('VITE_SUPABASE_ANON_KEY must be a public anon/publishable key, not a privileged key.');
  } catch (error) {
    if (error?.message?.includes('must be a public')) throw error;
  }
}
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
if (mode === 'release' && !/^https:\/\//i.test(supabaseUrl)) fail('VITE_SUPABASE_URL must be an HTTPS Supabase project URL.');

if (mode === 'release') {
  const propertiesPath = resolve(root, 'android/keystore.properties');
  if (!existsSync(propertiesPath)) fail('android/keystore.properties is missing. Copy the .example file and configure your private release keystore.');
  const properties = readFileSync(propertiesPath, 'utf8');
  for (const name of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
    const match = properties.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*?)\\s*$`, 'm'));
    if (!match || !match[1] || /REPLACE_WITH_YOUR_PRIVATE_PASSWORD/.test(match[1])) fail(`android/keystore.properties requires ${name}.`);
  }
  const storeFile = properties.match(/^\s*storeFile\s*=\s*(.*?)\s*$/m)?.[1];
  if (!storeFile || !existsSync(resolve(root, 'android', storeFile))) fail('the storeFile configured in android/keystore.properties does not exist.');
}

// Pass local values to Vite without displaying them in the build command output.
for (const name of publicConfig) process.env[name] ||= env[name];
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'android:sync']);

const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradle, [`assemble${mode[0].toUpperCase()}${mode.slice(1)}`], { cwd: resolve(root, 'android') });

const variant = mode;
const apk = resolve(root, `android/app/build/outputs/apk/${variant}/app-${variant}.apk`);
if (!existsSync(apk)) fail(`Gradle completed but expected APK is missing: ${apk}`);
if (mode === 'release') {
  console.log(`Signed release APK built at: ${apk}`);
  run('node', ['scripts/android-verify.mjs']);
} else {
  console.log(`Debug APK built at: ${apk}`);
}
