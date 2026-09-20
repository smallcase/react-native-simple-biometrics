#import "SimpleBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <Security/Security.h>

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

- (void)requestBioAuth:(nonnull NSString *)promptTitle promptMessage:(nonnull NSString *)promptMessage cancelLabel:(nonnull NSString *)cancelLabel allowDeviceCredentials:(BOOL)allowDeviceCredentials resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  @try {
    dispatch_async(
                   dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0),
                   ^{
                     LAContext *context = [[LAContext alloc] init];
                     context.localizedFallbackTitle = nil;
                     if (cancelLabel.length > 0) {
                       context.localizedCancelTitle = cancelLabel;
                     }
                     
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

- (void)createKeys:(nonnull NSString *)keyName resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  @try {
    NSData *tag = [keyName dataUsingEncoding:NSUTF8StringEncoding];
    
    NSDictionary *query = @{
      (id)kSecClass: (id)kSecClassKey,
      (id)kSecAttrApplicationTag: tag,
      (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
      (id)kSecReturnRef: @YES,
    };
    
    CFTypeRef existing = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &existing);
    if (status == errSecSuccess) {
      if (existing) {
        CFRelease(existing);
      }
      reject(@"biometric_error", @"key already exists", nil);
      return;
    }
    
    SecAccessControlRef access = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault,
      kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      kSecAccessControlBiometryCurrentSet | kSecAccessControlPrivateKeyUsage,
      NULL
    );
    
    if (!access) {
      reject(@"biometric_error", @"failed to create access control", nil);
      return;
    }
    
    NSDictionary *attributes = @{
      (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
      (id)kSecAttrKeySizeInBits: @2048,
      (id)kSecAttrTokenID: (id)kSecAttrTokenIDSecureEnclave,
      (id)kSecPrivateKeyAttrs: @{
        (id)kSecAttrIsPermanent: @YES,
        (id)kSecAttrApplicationTag: tag,
        (id)kSecAttrAccessControl: (__bridge id)access,
      },
    };
    
    CFErrorRef error = NULL;
    SecKeyRef privateKey = SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &error);
    CFRelease(access);
    
    if (!privateKey) {
      NSString *message = error
        ? (__bridge_transfer NSString *)CFErrorCopyDescription(error)
        : @"failed to generate key";
      if (error) {
        CFRelease(error);
      }
      reject(@"biometric_error", message, nil);
      return;
    }
    
    SecKeyRef publicKey = SecKeyCopyPublicKey(privateKey);
    CFRelease(privateKey);
    
    CFDataRef publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error);
    CFRelease(publicKey);
    
    if (!publicKeyData) {
      if (error) {
        CFRelease(error);
      }
      reject(@"biometric_error", @"failed to export public key", nil);
      return;
    }
    
    NSString *publicKeyBase64 = [(__bridge NSData *)publicKeyData base64EncodedStringWithOptions:0];
    CFRelease(publicKeyData);
    
    resolve(@{
      @"keyName": keyName,
      @"publicKey": publicKeyBase64,
      @"algorithm": @"RSA",
    });
  }
  @catch (NSException *exception) {
    reject(@"biometric_error", exception.reason ?: @"failed to create key", nil);
  }
}

- (void)biometricKeysExist:(nonnull NSString *)keyName resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  NSData *tag = [keyName dataUsingEncoding:NSUTF8StringEncoding];
  
  NSDictionary *query = @{
    (id)kSecClass: (id)kSecClassKey,
    (id)kSecAttrApplicationTag: tag,
    (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
  };
  
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, NULL);
  resolve(@(status == errSecSuccess));
}

- (void)deleteKeys:(nonnull NSString *)keyName resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  NSData *tag = [keyName dataUsingEncoding:NSUTF8StringEncoding];
  
  NSDictionary *query = @{
    (id)kSecClass: (id)kSecClassKey,
    (id)kSecAttrApplicationTag: tag,
    (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
  };
  
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
  
  if (status == errSecSuccess) {
    resolve(@(YES));
  } else if (status == errSecItemNotFound) {
    resolve(@(NO));
  } else {
    reject(@"biometric_error", [NSString stringWithFormat:@"failed to delete key: %d", (int)status], nil);
  }
}

- (void)createSignature:(nonnull NSString *)keyName payload:(nonnull NSString *)payload promptMessage:(nonnull NSString *)promptMessage resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
  @try {
    NSData *tag = [keyName dataUsingEncoding:NSUTF8StringEncoding];
    
    LAContext *context = [[LAContext alloc] init];
    context.localizedReason = promptMessage;
    
    NSDictionary *query = @{
      (id)kSecClass: (id)kSecClassKey,
      (id)kSecAttrApplicationTag: tag,
      (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
      (id)kSecReturnRef: @YES,
      (id)kSecUseAuthenticationContext: context,
    };
    
    CFTypeRef keyRef = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &keyRef);
    if (status != errSecSuccess || !keyRef) {
      if (keyRef) {
        CFRelease(keyRef);
      }
      reject(@"biometric_error", @"key does not exist", nil);
      return;
    }
    
    SecKeyRef privateKey = (SecKeyRef)keyRef;
    
    SecKeyRef publicKey = SecKeyCopyPublicKey(privateKey);
    CFDataRef publicKeyData = SecKeyCopyExternalRepresentation(publicKey, NULL);
    CFRelease(publicKey);
    
    if (!publicKeyData) {
      CFRelease(privateKey);
      reject(@"biometric_error", @"failed to export public key", nil);
      return;
    }
    
    NSString *publicKeyBase64 = [(__bridge NSData *)publicKeyData base64EncodedStringWithOptions:0];
    CFRelease(publicKeyData);
    
    NSData *data = [payload dataUsingEncoding:NSUTF8StringEncoding];
    
    CFErrorRef error = NULL;
    CFDataRef signatureData = SecKeyCreateSignature(
      privateKey,
      kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA256,
      (__bridge CFDataRef)data,
      &error
    );
    CFRelease(privateKey);
    
    if (!signatureData) {
      NSString *message = error
        ? (__bridge_transfer NSString *)CFErrorCopyDescription(error)
        : @"failed to create signature";
      if (error) {
        CFRelease(error);
      }
      reject(@"biometric_error", message, nil);
      return;
    }
    
    NSString *signatureBase64 = [(__bridge NSData *)signatureData base64EncodedStringWithOptions:0];
    CFRelease(signatureData);
    
    resolve(@{
      @"keyName": keyName,
      @"publicKey": publicKeyBase64,
      @"signature": signatureBase64,
    });
  }
  @catch (NSException *exception) {
    reject(@"biometric_error", exception.reason ?: @"failed to create signature", nil);
  }
}

@end
