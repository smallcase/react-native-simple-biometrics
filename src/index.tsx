import SimpleBiometrics from './NativeSimpleBiometrics';

export type Options = {
  /**
   * If biometrics is not available, use device credentials
   * @default true
   */
  allowDeviceCredentials?: boolean;
  /**
   * Label for the cancel button on the authentication prompt (Android only).
   * @default 'Cancel'
   */
  cancelLabel?: string;
};

export type BioAuthRequest = {
  /** title of prompt */
  promptTitle: string;
  /** The app-provided reason for requesting authentication. */
  promptMessage: string;
  /**
   * If biometrics is not available, use device credentials
   * @default true
   */
  allowDeviceCredentials?: boolean;
  /**
   * Label for the cancel button on the authentication prompt (Android only).
   * @default 'Cancel'
   */
  cancelLabel?: string;
};

/**
 * check if authentication is possible
 */
const canAuthenticate = (options?: Options): Promise<boolean> => {
  const { allowDeviceCredentials = true } = options ?? {};

  return SimpleBiometrics.canAuthenticate(allowDeviceCredentials);
};

/**
 * @deprecated Use the object form instead:
 * `requestBioAuth({ promptTitle, promptMessage, ...options })`
 *
 * note: promise will resolve when successful
 * but will be rejected when not with an error message
 */
function requestBioAuth(
  /** title of prompt */
  promptTitle: string,
  /** The app-provided reason for requesting authentication, which displays in the authentication dialog presented to the user. */
  promptMessage: string,
  options?: Options
): Promise<boolean>;

/**
 * request biometric authentication
 *
 * note: promise will resolve when successful
 * but will be rejected when not with an error message
 */
function requestBioAuth(request: BioAuthRequest): Promise<boolean>;

function requestBioAuth(
  promptTitleOrRequest: string | BioAuthRequest,
  promptMessage?: string,
  options?: Options
): Promise<boolean> {
  let promptTitle: string;
  let promptMessageValue: string;
  let opts: Options;

  if (
    typeof promptTitleOrRequest === 'object' &&
    promptTitleOrRequest !== null
  ) {
    promptTitle = promptTitleOrRequest.promptTitle;
    promptMessageValue = promptTitleOrRequest.promptMessage;
    opts = promptTitleOrRequest;
  } else {
    promptTitle = promptTitleOrRequest;
    promptMessageValue = promptMessage!;
    opts = options ?? {};
  }

  if (typeof promptTitle !== 'string' || !promptTitle) {
    throw new Error('prompt title must be a non empty string');
  }

  if (typeof promptMessageValue !== 'string' || !promptMessageValue) {
    throw new Error('prompt message must be a non empty string');
  }

  const { allowDeviceCredentials = true, cancelLabel = 'Cancel' } = opts;

  return SimpleBiometrics.requestBioAuth(
    promptTitle,
    promptMessageValue,
    cancelLabel,
    allowDeviceCredentials
  );
}

const RNBiometrics = {
  requestBioAuth,
  canAuthenticate,
};

export default RNBiometrics;
