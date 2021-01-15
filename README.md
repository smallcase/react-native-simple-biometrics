# React Native Simple Biometrics

A simple and straight forward API to ask a user to authenticate with on device biometrics. This can be used to quickly verify if the app is being used by the owner of the phone (or a trustee) before showing some sensitive info.

## Getting started

`$ yarn add react-native-simple-biometrics`

## minimum versions

- iOS target: `8.0`
- Android minSdkVersion: `21`

## iOS permission

It is required to add an entry in your ios app's `info.plist` giving a valid reason to use the phones face ID system.

```
<key>NSFaceIDUsageDescription</key>
<string>a valid reason to use biometrics</string>
```

Calling the authenticate function will automatically ask iOS users for the permission. For more control over when to ask permissions, use [react-native-permissions](https://www.npmjs.com/package/react-native-permissions)

## Usage

Only 2 methods are exposed

- `canAuthenticate()`
- `requestBioAuth(title: string, subtitle: string)`

```javascript
import RNBiometrics from "react-native-simple-biometrics";

// this will be false if
// - no biometrics hardware
// - permission was denied for face ID (iOS only)
const can = await RNBiometrics.canAuthenticate();

if (can) {
  try {
    await RNBiometrics.requestBioAuth("title", "subtitle");
    // stuff to do when authenticated
    // ...
  } catch (error) {
    // stuff to do when auth failed
    // ...
  }
}
```

## credits

[react-native-biometrics](https://www.npmjs.com/package/react-native-biometrics) is a super-set of this library. For more security features (keys, signatures, etc) this react-native-biometrics is the package to select.
