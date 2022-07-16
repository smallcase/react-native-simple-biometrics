declare const RNBiometrics: {
  /**
   * request biometric authentication
   *
   * note: promise will resolve when successful
   * but will be rejected when not with an error message
   */
  requestBioAuth: (
    /** title of prompt (can be an empty string) */
    promptTitle: string,
    /** The app-provided reason for requesting authentication, which displays in the authentication dialog presented to the user. */
    promptMessage: string
  ) => Promise<boolean>;

  /**
   * check if authentication is possible
   */
  canAuthenticate: () => Promise<boolean>;
};

export default RNBiometrics;
