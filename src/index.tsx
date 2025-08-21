import { NativeModules } from 'react-native';

const { SimpleBiometrics: RNBiometricsNative } = NativeModules;

type CanAuthenticateOptions = {
  /**
   * If biometrics is not available, use device credentials
   */
  allowDeviceCredentials: boolean;
};

/**
 * check if authentication is possible
 */
const canAuthenticate = (
  options?: CanAuthenticateOptions
): Promise<boolean> => {
  const { allowDeviceCredentials = false } = options ?? {};

  return RNBiometricsNative.canAuthenticate(allowDeviceCredentials);
};

/**
 * request biometric authentication
 *
 * note: promise will resolve when successful
 * but will be rejected when not with an error message
 */
const requestBioAuth = (
  /** title of prompt */
  promptTitle: string,
  /** The app-provided reason for requesting authentication, which displays in the authentication dialog presented to the user. */
  promptMessage: string
): Promise<boolean> => {
  if (typeof promptTitle !== 'string' || !promptTitle) {
    throw new Error('prompt title must be a non empty string');
  }

  if (typeof promptMessage !== 'string' || !promptMessage) {
    throw new Error('prompt message must be a non empty string');
  }

  return RNBiometricsNative.requestBioAuth(promptTitle, promptMessage);
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
