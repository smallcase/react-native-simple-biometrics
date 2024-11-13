
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNSimpleBiometricsSpec.h"

@interface SimpleBiometrics : NSObject <NativeSimpleBiometricsSpec>
#else
#import <React/RCTBridgeModule.h>

@interface SimpleBiometrics : NSObject <RCTBridgeModule>
#endif

@end
