# react-native-simple-biometrics

## Getting started

`$ yarn add https://gitlab.com/smallcase/mobile/react-native-simple-biometrics.git`

## Usage

```javascript
import RNBiometrics from "react-native-simple-biometrics";

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
