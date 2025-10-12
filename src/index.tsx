import SimpleBiometrics from './NativeSimpleBiometrics';

type Options = {
  /**
   * If biometrics is not available, use device credentials
   */
  allowDeviceCredentials: boolean;
};

/**
 * check if authentication is possible
 */
const canAuthenticate = (options?: Options): Promise<boolean> => {
  const { allowDeviceCredentials = true } = options ?? {};

  return SimpleBiometrics.canAuthenticate(allowDeviceCredentials);
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
  promptMessage: string,
  options?: Options
): Promise<boolean> => {
  if (typeof promptTitle !== 'string' || !promptTitle) {
    throw new Error('prompt title must be a non empty string');
  }

  if (typeof promptMessage !== 'string' || !promptMessage) {
    throw new Error('prompt message must be a non empty string');
  }

  const { allowDeviceCredentials = true } = options ?? {};

  return SimpleBiometrics.requestBioAuth(
    promptTitle,
    promptMessage,
    allowDeviceCredentials
  );
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
