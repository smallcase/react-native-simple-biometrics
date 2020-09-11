import { NativeModules, Platform } from "react-native";

const { RNBiometrics: RNBiometricsNative } = NativeModules;

/**
 * check if authentication is possible
 *
 * @returns {Promise<boolean>} result
 */
const canAuthenticate = () => {
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
  return RNBiometricsNative.requestBioAuth(title || "", subtitle || "");
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
