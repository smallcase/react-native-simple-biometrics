# React Native Simple Biometrics

![npm](https://img.shields.io/npm/v/react-native-simple-biometrics?color=%231F7AE0)

## Overview

React Native Simple Biometrics is a straightforward and minimalistic React Native package designed to provide developers with an API for implementing user authentication using on-device biometrics. This library facilitates the quick verification of the app's user, ensuring that sensitive information is only accessible to authorized individuals, such as the phone owner or a trustee.

![demo](./demo.gif?raw=true 'demo')

## Installation

```bash
# Using npm
$ npm install react-native-simple-biometrics

# Using Yarn
$ yarn add react-native-simple-biometrics
```

**Important:** Version 3+ of this library requires React Native's New Architecture (Fabric/TurboModules). If you're using React Native's Old Architecture, please use version 2 or below:

```bash
# For Old Architecture (React Native < 0.68 or without New Architecture enabled)
$ npm install react-native-simple-biometrics@^2.0.0

# or
$ yarn add react-native-simple-biometrics@^2.0.0
```

## Minimum Requirements

- iOS target: `10.0`
- Android minSdkVersion: `21`

## iOS Permission

To utilize the Face ID system on iOS devices, it is mandatory to include an entry in your iOS app's `info.plist`, explaining the valid reason for using biometrics:

```xml
<key>NSFaceIDUsageDescription</key>
<string>a valid reason to use biometrics</string>
```

When you call the `authenticate` function, iOS users will be automatically prompted for permission. For more granular control over when to request permissions, you can utilize the [react-native-permissions](https://www.npmjs.com/package/react-native-permissions) package.

## Usage

React Native Simple Biometrics offers two main methods:

1. `canAuthenticate(options?: Options)`: Checks whether the device supports biometric authentication. Returns `true` if the hardware is available or if permission for Face ID (iOS) was granted.

Parameters

- `options` (optional): An object containing configuration options
  - `allowDeviceCredentials` (boolean, default: true): Whether to allow device credentials (passcode/password) as a fallback when biometric authentication is not available

Return Value

Returns a Promise<boolean> that resolves to:

- true if authentication is possible with the specified options
- false if authentication is not possible

2. `requestBioAuth(...)`: Initiates the biometric authentication process, displaying a user-friendly prompt with the specified title and message. This function can be used for user authentication.

It can be called with a single object (recommended):

```javascript
await RNBiometrics.requestBioAuth({
  promptTitle: 'prompt-title',
  promptMessage: 'prompt-message',
  cancelLabel: 'Cancel', // optional, Android only, default 'Cancel'
  allowDeviceCredentials: false, // optional, default true
});
```

or with positional arguments (deprecated):

```javascript
await RNBiometrics.requestBioAuth('prompt-title', 'prompt-message', {
  cancelLabel: 'Cancel', // optional, Android only, default 'Cancel'
  allowDeviceCredentials: false, // optional, default true
});
```

Parameters

- `promptTitle` (string): The title displayed in the authentication dialog
  Must be a non-empty string
  Throws an error if not provided or empty
- `promptMessage` (string): The subtitle/reason for requesting authentication
  Must be a non-empty string
  Throws an error if not provided or empty
  Displays in the authentication dialog to explain why authentication is needed

Optional Parameters

- `allowDeviceCredentials` (boolean, default: true): Whether to allow device credentials (passcode/password) as a fallback when biometric authentication is not available
- `cancelLabel` (string, default: `'Cancel'`, Android only): Label for the cancel button on the authentication prompt

Return Value

Returns a Promise<boolean> that:

- Resolves to true when authentication is successful
- Rejects with an error when authentication fails or is cancelled

Here's a code snippet demonstrating how to use these methods:

```javascript
import RNBiometrics from 'react-native-simple-biometrics';

// Check if biometric authentication is available, will fallback to device passcode by default if not
const can = await RNBiometrics.canAuthenticate();

if (can) {
  try {
    await RNBiometrics.requestBioAuth('prompt-title', 'prompt-message');
    // Code to execute when authenticated
    // ...
  } catch (error) {
    // Code to handle authentication failure
    // ...
  }
}
```

## Key Generation & Signatures

In addition to simple authentication, the library can generate a biometric-protected key pair and sign payloads with it. The private key is stored in the iOS Secure Enclave or Android Keystore and can only be used after the user passes biometric authentication.

| Method | Description |
| --- | --- |
| `createKeys(options?)` | Generates a new key pair. Rejects if a key with the given name already exists. |
| `biometricKeysExist(options?)` | Checks whether a key pair exists. |
| `deleteKeys(options?)` | Deletes a key pair. Resolves `true` if a key was deleted, `false` otherwise. |
| `createSignature(payload, options?)` | Signs a UTF-8 string payload with the private key, prompting for biometric authentication. |

### Algorithms and server verification

Both platforms return Base64-encoded DER SubjectPublicKeyInfo (SPKI) public keys and hash the UTF-8 payload with SHA-256. iOS uses Secure Enclave P-256 keys and ECDSA signatures encoded as an ASN.1 DER sequence of `r` and `s`. Android uses RSA-2048 with PKCS#1 v1.5 signatures. Select the verification algorithm from the registered public key; signatures are not interchangeable between algorithms. Android hardware backing depends on the device.

### `createKeys(options?)`

Returns a `Promise<BiometricKey>` that resolves to:

- `keyName` (string): The identifier for this key pair.
- `publicKey` (string): Base64-encoded public key (X.509/SPKI).
- `algorithm` (string): The key algorithm: `"EC"` (P-256) on iOS or `"RSA"` (2048-bit) on Android.

Parameters:

- `options` (optional): An object containing configuration options
  - `keyName` (string, default: `"default"`): Identifier for the key pair. Use a distinct name to hold multiple keys for different purposes.

### `createSignature(payload, options?)`

Returns a `Promise<Signature>` that resolves to:

- `keyName` (string): The identifier for the key pair used to sign.
- `publicKey` (string): Base64-encoded public key, for verifying the signature.
- `signature` (string): Base64-encoded signature over the payload.

Required Parameters:

- `payload` (string): The UTF-8 string to sign. The payload is hashed (SHA-256) internally.

Optional Parameters:

- `options` (object, optional): Configuration options
  - `keyName` (string, default: `"default"`): Identifier for the key pair used to sign.
  - `promptMessage` (string, default: `"Authenticate to sign"`): Reason shown in the biometric prompt.

```javascript
import RNBiometrics from 'react-native-simple-biometrics';

// Generate a biometric-protected key pair
const { publicKey } = await RNBiometrics.createKeys();

// Sign a payload (prompts for biometric authentication)
const { signature } = await RNBiometrics.createSignature('nonce-123', {
  promptMessage: 'Sign in to your account',
});

// Verify on your server using the public key and signature

// Clean up when no longer needed
await RNBiometrics.deleteKeys();
```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## Credits

React Native Simple Biometrics is a simplified version of [react-native-biometrics](https://www.npmjs.com/package/react-native-biometrics).

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
