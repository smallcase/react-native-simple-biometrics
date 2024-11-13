import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-simple-biometrics' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const SimpleBiometricsModule = isTurboModuleEnabled
  ? require('./NativeSimpleBiometrics').default
  : NativeModules.SimpleBiometrics;

const RNBiometricsNative = SimpleBiometricsModule
  ? SimpleBiometricsModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * @deprecated - use checkCapability()
 *
 * check if authentication is possible
 */
const canAuthenticate = (): Promise<boolean> => {
  return RNBiometricsNative.canAuthenticate();
};

/**
 * check if authentication is possible
 */
const checkCapability = (): Promise<{
  canAuthenticate: boolean;
  errorReason: string;
}> => {
  return RNBiometricsNative.checkCapability();
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
  checkCapability,
  canAuthenticate,
};

export default RNBiometrics;
