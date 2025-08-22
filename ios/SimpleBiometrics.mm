#import "SimpleBiometrics.h"

#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTConvert.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNSimpleBiometricsSpec.h"
#endif

@implementation SimpleBiometrics
RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(canAuthenticate, allowDeviceCredentials
                 : (BOOL)allowDeviceCredentials canAuthenticateWithResolver
                 : (RCTPromiseResolveBlock)resolve rejecter
                 : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;

  LAPolicy localAuthPolicy =
      allowDeviceCredentials
          // LAPolicyDeviceOwnerAuthentication allows authentication using
          // biometrics (Face ID/Touch ID) or device passcode.
          // If biometry is available, enrolled, and not disabled, the system
          // uses that first. When these options aren’t available, the system
          // prompts the user for the device passcode or user’s password.
          ? LAPolicyDeviceOwnerAuthentication
          // LAPolicyDeviceOwnerAuthenticationWithBiometrics policy evaluation
          // fails if Touch ID or Face ID is unavailable or not enrolled.
          : LAPolicyDeviceOwnerAuthenticationWithBiometrics;

  BOOL canEvaluatePolicy = [context canEvaluatePolicy:localAuthPolicy
                                                error:&la_error];

  if (canEvaluatePolicy) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

RCT_REMAP_METHOD(requestBioAuth, title
                 : (NSString *)title subtitle
                 : (NSString *)subtitle requestBioAuthWithResolver
                 : (RCTPromiseResolveBlock)resolve rejecter
                 : (RCTPromiseRejectBlock)reject) {

  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *promptMessage = subtitle;

        LAContext *context = [[LAContext alloc] init];
        context.localizedFallbackTitle = nil;

        LAPolicy localAuthPolicy =
            LAPolicyDeviceOwnerAuthenticationWithBiometrics;
        if (![[UIDevice currentDevice].systemVersion hasPrefix:@"8."]) {
          localAuthPolicy = LAPolicyDeviceOwnerAuthentication;
        }

        [context evaluatePolicy:localAuthPolicy
                localizedReason:promptMessage
                          reply:^(BOOL success, NSError *biometricError) {
                            if (success) {
                              resolve(@(YES));

                            } else {
                              NSString *message = [NSString
                                  stringWithFormat:@"%@",
                                                   biometricError
                                                       .localizedDescription];
                              reject(@"biometric_error", message, nil);
                            }
                          }];
      });
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSimpleBiometricsSpecJSI>(
      params);
}
#endif

@end
