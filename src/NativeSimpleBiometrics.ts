import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  canAuthenticate(allowDeviceCredentials: boolean): Promise<boolean>;
  requestBioAuth(
    promptTitle: string,
    promptMessage: string,
    allowDeviceCredentials: boolean
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SimpleBiometrics');
