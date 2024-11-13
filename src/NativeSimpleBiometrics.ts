import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  canAuthenticate(): Promise<boolean>;
  checkCapability(): Promise<{ canAuthenticate: boolean; errorReason: string }>;
  requestBioAuth(promptTitle: string, promptMessage: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SimpleBiometrics');
