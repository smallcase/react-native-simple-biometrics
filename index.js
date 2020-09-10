import { NativeModules, Platform } from "react-native";

const { RNBiometrics: RNBiometricsNative } = NativeModules;

/**
 * check if authentication is possible
 *
 * @returns {Promise<boolean>} result
 */
const canAuthenticate = () => {
  if (Platform.OS === "ios") {
    // no op for ios
    return Promise.resolve(true);
  }

  return RNBiometricsNative.canAuthenticate();
};

/**
 * request biometric authentication
 *
 * note: promise will resolve when successful
 * but will be rejected when not with an error message
 *
 * @param {string} title
 * @param {string} subtitle
 * @returns {Promise<boolean>} result
 */
const requestBioAuth = (title, subtitle) => {
  if (Platform.OS === "ios") {
    // no op for ios
    return Promise.resolve(true);
  }

  return RNBiometricsNative.requestBioAuth(title || "", subtitle || "");
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
