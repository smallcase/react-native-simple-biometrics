#import "SimpleBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>

@implementation SimpleBiometrics

+ (NSString *)moduleName
{
  return @"SimpleBiometrics";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSimpleBiometricsSpecJSI>(params);
}


- (LAPolicy)getLocalAuthPolicy:(BOOL)allowDeviceCredentials {
  if (allowDeviceCredentials) {
    // LAPolicyDeviceOwnerAuthentication allows authentication using
    // biometrics (Face ID/Touch ID) or device passcode.
    // If biometry is available, enrolled, and not disabled, the system
    // uses that first. When these options aren’t available, the system
    // prompts the user for the device passcode or user’s password.
    return LAPolicyDeviceOwnerAuthentication;
  } else {
    // LAPolicyDeviceOwnerAuthenticationWithBiometrics policy evaluation
    // fails if Touch ID or Face ID is unavailable or not enrolled.
    return LAPolicyDeviceOwnerAuthenticationWithBiometrics;
  }
}

- (void)canAuthenticate:(BOOL)allowDeviceCredentials resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  
  LAPolicy localAuthPolicy = [self getLocalAuthPolicy:allowDeviceCredentials];
  
  BOOL canEvaluatePolicy = [context canEvaluatePolicy:localAuthPolicy
                                                error:&la_error];
  
  if (canEvaluatePolicy) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

- (void)requestBioAuth:(nonnull NSString *)promptTitle promptMessage:(nonnull NSString *)promptMessage allowDeviceCredentials:(BOOL)allowDeviceCredentials resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  @try {
    dispatch_async(
                   dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),
                   ^{
                     LAContext *context = [[LAContext alloc] init];
                     context.localizedFallbackTitle = nil;
                     
                     LAPolicy localAuthPolicy =
                     [self getLocalAuthPolicy:allowDeviceCredentials];
                     
                     [context evaluatePolicy:localAuthPolicy
                             localizedReason:promptMessage
                                       reply:^(BOOL success,
                                               NSError *biometricError) {
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
  @catch (NSException *exception) {
    // Code to handle the exception.
    // The 'exception' object contains details about the exception.
    NSLog(@"Caught an exception: %@", exception.name);
    NSLog(@"Reason: %@", exception.reason);
    // You can perform error logging, display an alert, or attempt recovery here.
  }
  @finally {
    // Optional: Code that will always execute, regardless of whether an exception was thrown or caught.
    // This is useful for cleanup tasks, like closing files or releasing resources.
  }
  
}

@end
