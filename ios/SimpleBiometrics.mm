#import "SimpleBiometrics.h"

#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTConvert.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNSimpleBiometricsSpec.h"
#endif

@implementation SimpleBiometrics
RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(canAuthenticate,
                 canAuthenticateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    LAContext *context = [[LAContext alloc] init];
    NSError *la_error = nil;
    BOOL canEvaluatePolicy = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&la_error];

    if (canEvaluatePolicy) {
        resolve(@(YES));
    } else {
        resolve(@(NO));
    }
}

RCT_REMAP_METHOD(requestBioAuth,
                 title:(NSString *)title
                 subtitle:(NSString *)subtitle
                 requestBioAuthWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{

    dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *promptMessage = subtitle;

        LAContext *context = [[LAContext alloc] init];
        context.localizedFallbackTitle = title;

        LAPolicy localAuthPolicy = LAPolicyDeviceOwnerAuthenticationWithBiometrics;
        if (![[UIDevice currentDevice].systemVersion hasPrefix:@"8."]) {
            localAuthPolicy = LAPolicyDeviceOwnerAuthentication;
        }

        [context evaluatePolicy:localAuthPolicy localizedReason:promptMessage reply:^(BOOL success, NSError *biometricError) {
            if (success) {
                resolve( @(YES));

            } else {
                NSString *message = [NSString stringWithFormat:@"%@", biometricError.localizedDescription];
                reject(@"biometric_error", message, nil);
            }
        }];
    });

}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSimpleBiometricsSpecJSI>(params);
}
#endif

@end
