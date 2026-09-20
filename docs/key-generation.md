# Key Generation & Signatures — Implementation Plan

## Goal

Add on-device biometric key generation and payload signing to `react-native-simple-biometrics`. The private key lives in the iOS Secure Enclave or Android Keystore (hardware backing depends on the Android device) and cannot be used without passing biometric authentication.

## API surface

```ts
type KeyCreationOptions = {
  /** Identifier for this key pair (allows multiple keys). Default: 'default'. */
  keyName?: string;
};

type SigningOptions = {
  keyName?: string; // default: 'default'
  /** Reason shown in the biometric prompt. Default: 'Authenticate to sign'. */
  promptMessage?: string;
};

type BiometricKey = {
  keyName: string;
  publicKey: string;   // base64, X.509/SPKI
  algorithm: 'EC' | 'RSA'; // P-256 on iOS, RSA-2048 on Android
};

type Signature = {
  keyName: string;
  publicKey: string;   // base64 — exposed for one-call verification
  signature: string;   // base64
};
```

```ts
const RNBiometrics = {
  createKeys(options?: KeyCreationOptions): Promise<BiometricKey>,
  biometricKeysExist(options?: { keyName?: string }): Promise<boolean>,
  deleteKeys(options?: { keyName?: string }): Promise<boolean>,
  createSignature(payload: string, options?: SigningOptions): Promise<Signature>,
};
```

### Error semantics (resolve/reject, consistent with `requestBioAuth`)

- `createKeys` **rejects** if a key with `keyName` already exists.
- `createSignature` **rejects** on auth failure/cancel and if no key exists for `keyName`.
- `deleteKeys` resolves `true` if a key was deleted, `false` if none existed.
- `biometricKeysExist` resolves the boolean.

### Algorithm

Payloads are UTF-8 strings hashed with SHA-256 internally. Android uses RSA-2048 with `SHA256withRSA` (PKCS#1 v1.5). iOS uses Secure Enclave P-256 with `ECDSASignatureMessageX962SHA256` (ASN.1 DER signatures). Both platforms export public keys as Base64-encoded DER SPKI; the server chooses verification based on the registered key algorithm. Android keys also get `ENCRYPT`/`DECRYPT` purposes so future encryption support is non-breaking.

## Design notes

- **Options objects, not positional args** — new optional params can be added later without breaking callers.
- **Objects returned, not bare primitives** — fields (`algorithm`, `publicKey`) can be added later without breaking.
- **Named keys (`keyName`)** — the load-bearing decision. iOS keychain and Android Keystore are already keyed by name; exposing it now makes multi-key support non-breaking later.
- **Auth policy is a creation-time property** (iOS `SecAccessControl`, Android `KeyGenParameterSpec`); keys are biometric-only.

## Implementation steps

1. **TurboModule spec** (`src/NativeSimpleBiometrics.ts`) — add result types and four methods. Codegen (`install_modules_dependencies` on iOS, `com.facebook.react` plugin on Android) propagates to both platforms automatically.
2. **JS wrapper** (`src/index.tsx`) — apply defaults (`keyName = 'default'`, `promptMessage = 'Authenticate to sign'`) and delegate to native.
3. **Android** (`SimpleBiometricsModule.kt`) — `KeyStore` + `KeyGenParameterSpec`; reuse existing `BiometricPrompt` scaffolding for `CryptoObject` signing.
4. **iOS** (`SimpleBiometrics.mm`) — `SecKeyCreateRandomKey`, `SecItemCopyMatching`/`SecItemDelete`, `SecKeyCreateSignature`.
5. **`SimpleBiometrics.podspec`** — link both `LocalAuthentication` and `Security`.
6. **Docs, example, tests** — README section, example app demo, unit tests.

## Suggested order

1. TS spec + JS wrapper (one unit; codegen will fail to build until native is done)
2. Android native
3. iOS native + podspec
4. Example, README, tests
5. `yarn typecheck`, `yarn lint`, build example on both platforms
