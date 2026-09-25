import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type CreateKeysResult = {
  keyName: string;
  /** Base64-encoded DER SubjectPublicKeyInfo (SPKI). */
  publicKey: string;
  /** EC (P-256) on both platforms. */
  algorithm: string;
};

export type CreateSignatureResult = {
  keyName: string;
  /** Base64-encoded DER SubjectPublicKeyInfo (SPKI). */
  publicKey: string;
  /** Base64 ECDSA DER signature using SHA-256 on both platforms. */
  signature: string;
};

export interface Spec extends TurboModule {
  canAuthenticate(allowDeviceCredentials: boolean): Promise<boolean>;
  requestBioAuth(
    promptTitle: string,
    promptMessage: string,
    cancelLabel: string,
    allowDeviceCredentials: boolean
  ): Promise<boolean>;
  createKeys(keyName: string): Promise<CreateKeysResult>;
  biometricKeysExist(keyName: string): Promise<boolean>;
  deleteKeys(keyName: string): Promise<boolean>;
  createSignature(
    keyName: string,
    payload: string,
    promptMessage: string
  ): Promise<CreateSignatureResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SimpleBiometrics');
