import SimpleBiometrics from './NativeSimpleBiometrics';
import type {
  CreateKeysResult,
  CreateSignatureResult,
} from './NativeSimpleBiometrics';

export type BiometricKey = CreateKeysResult;
export type Signature = CreateSignatureResult;

type Options = {
  /**
   * If biometrics is not available, use device credentials
   */
  allowDeviceCredentials: boolean;
};

type KeyOptions = {
  /**
   * Identifier for this key pair. Allows multiple keys for different purposes.
   * @default 'default'
   */
  keyName?: string;
};

type SigningOptions = {
  /**
   * Identifier for the key pair used to sign.
   * @default 'default'
   */
  keyName?: string;
  /**
   * Reason shown in the biometric prompt.
   * @default 'Authenticate to sign'
   */
  promptMessage?: string;
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

/**
 * create a biometric protected key pair
 *
 * note: promise will resolve with the generated public key
 * but will be rejected if a key with the given key name already exists
 */
const createKeys = (options?: KeyOptions): Promise<BiometricKey> => {
  const { keyName = 'default' } = options ?? {};

  return SimpleBiometrics.createKeys(keyName);
};

/**
 * check if a biometric protected key pair exists
 */
const biometricKeysExist = (options?: KeyOptions): Promise<boolean> => {
  const { keyName = 'default' } = options ?? {};

  return SimpleBiometrics.biometricKeysExist(keyName);
};

/**
 * delete a biometric protected key pair
 */
const deleteKeys = (options?: KeyOptions): Promise<boolean> => {
  const { keyName = 'default' } = options ?? {};

  return SimpleBiometrics.deleteKeys(keyName);
};

/**
 * sign a payload using a biometric protected key pair
 *
 * note: promise will resolve with the signature and public key
 * but will be rejected when authentication fails or is cancelled
 */
const createSignature = (
  /** payload to sign */
  payload: string,
  options?: SigningOptions
): Promise<Signature> => {
  if (typeof payload !== 'string' || !payload) {
    throw new Error('payload must be a non empty string');
  }

  const { keyName = 'default', promptMessage = 'Authenticate to sign' } =
    options ?? {};

  return SimpleBiometrics.createSignature(keyName, payload, promptMessage);
};

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
  createKeys,
  biometricKeysExist,
  deleteKeys,
  createSignature,
};

export default RNBiometrics;
