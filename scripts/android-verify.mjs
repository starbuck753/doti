import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const apk = resolve(root, 'android/app/build/outputs/apk/release/app-release.apk');
const properties = readFileSync(resolve(root, 'android/gradle.properties'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const versionCode = Number(properties.match(/^DOTI_VERSION_CODE=(\d+)$/m)?.[1]);
const localPropertiesPath = resolve(root, 'android/local.properties');
const sdkLine = existsSync(localPropertiesPath) ? readFileSync(localPropertiesPath, 'utf8').match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m)?.[1]?.replaceAll('\\:', ':') : null;
const sdkRoots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME, sdkLine, join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk')].filter(Boolean);
function findTool(name) {
  for (const sdk of sdkRoots) {
    const dir = join(sdk, 'build-tools');
    if (!existsSync(dir)) continue;
    const versions = readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const executable = process.platform !== 'win32' ? name : name === 'apksigner' ? 'apksigner.bat' : `${name}.exe`;
      const tool = join(dir, version, executable);
      if (existsSync(tool)) return tool;
    }
  }
  return null;
}

if (!existsSync(apk)) throw new Error(`Release APK not found: ${apk}`);
if (!Number.isInteger(versionCode)) throw new Error('DOTI_VERSION_CODE is missing or invalid in android/gradle.properties.');
const apksigner = findTool('apksigner');
const aapt = findTool('aapt');
if (!apksigner || !aapt) throw new Error('Android SDK build-tools apksigner and aapt are required to verify the APK.');

const java = resolve(process.env.JAVA_HOME ?? '', 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
const apksignerJar = resolve(dirname(apksigner), 'lib', 'apksigner.jar');
if (!existsSync(java) || !existsSync(apksignerJar)) throw new Error('JDK java and SDK apksigner.jar are required to verify the release APK.');
const signature = spawnSync(java, ['-jar', apksignerJar, 'verify', '--verbose', '--print-certs', apk], { encoding: 'utf8' });
if (signature.status !== 0) throw new Error(`APK signature verification failed: ${signature.stderr}`);
const signingPath = resolve(root, 'android/keystore.properties');
if (!existsSync(signingPath)) throw new Error('Release signing configuration is missing; cannot confirm the configured signing identity.');
const signingText = readFileSync(signingPath, 'utf8');
const property = (name) => signingText.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*?)\\s*$`, 'm'))?.[1];
const keyStorePath = property('storeFile');
const keyAlias = property('keyAlias');
const keyStore = keyStorePath ? resolve(root, 'android', keyStorePath) : '';
if (!existsSync(keyStore) || !keyAlias) throw new Error('Configured release keystore or key alias is missing.');
const keytool = resolve(process.env.JAVA_HOME ?? '', 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
if (!existsSync(keytool)) throw new Error('keytool was not found under JAVA_HOME; configure a complete JDK to verify the signing identity.');
const storePassword = property('storePassword');
if (!storePassword) throw new Error('Release keystore password is missing from local signing configuration.');
const cert = spawnSync(keytool, ['-list', '-v', '-keystore', keyStore, '-alias', keyAlias, '-storepass:env', 'DOTI_VERIFY_STORE_PASSWORD'], {
  encoding: 'utf8',
  env: { ...process.env, DOTI_VERIFY_STORE_PASSWORD: storePassword },
});
if (cert.status !== 0) throw new Error('Could not read the configured release certificate. Check the local keystore and alias.');
const expectedDigest = cert.stdout.match(/SHA256:\s*([A-Fa-f0-9:]+)/)?.[1]?.replaceAll(':', '').toLowerCase();
const actualDigest = signature.stdout.match(/Signer #1 certificate SHA-256 digest:\s*([A-Fa-f0-9]+)/i)?.[1]?.toLowerCase();
if (!expectedDigest || !actualDigest || expectedDigest !== actualDigest) throw new Error('APK signer certificate does not match the configured release keystore.');
const metadata = spawnSync(aapt, ['dump', 'badging', apk], { encoding: 'utf8' });
if (metadata.status !== 0) throw new Error(`Could not read APK metadata: ${metadata.stderr}`);
const expected = `package: name='com.doti.app' versionCode='${versionCode}' versionName='${packageJson.version}'`;
if (!metadata.stdout.includes(expected)) throw new Error(`Unexpected APK package/version. Expected ${expected}.`);
console.log('APK signature verified by apksigner.');
console.log('APK signing certificate matches the configured release keystore.');
console.log(`APK metadata verified: com.doti.app ${packageJson.version} (versionCode ${versionCode}).`);
console.log(apk);
