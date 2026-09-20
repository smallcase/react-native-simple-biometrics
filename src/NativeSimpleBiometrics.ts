import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type CreateKeysResult = {
  keyName: string;
  publicKey: string;
  algorithm: string;
};

export type CreateSignatureResult = {
  keyName: string;
  publicKey: string;
  signature: string;
};

export interface Spec extends TurboModule {
  canAuthenticate(allowDeviceCredentials: boolean): Promise<boolean>;
  requestBioAuth(
    promptTitle: string,
    promptMessage: string,
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
