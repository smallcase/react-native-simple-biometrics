import { NativeModules } from "react-native";

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
 * @param {string} promptTitle - title of prompt (can be empty)
 * @param {string} promptMessage - The app-provided reason for requesting authentication, which displays in the authentication dialog presented to the user.
 * @returns {Promise<boolean>}
 */
const requestBioAuth = (promptTitle, promptMessage) => {
  if (typeof promptTitle !== "string" || !promptTitle) {
    throw new Error("prompt title must be a non empty string");
  }

  if (typeof promptMessage !== "string" || !promptMessage) {
    throw new Error("prompt message must be a non empty string");
  }

  return RNBiometricsNative.requestBioAuth(promptTitle, promptMessage);
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
