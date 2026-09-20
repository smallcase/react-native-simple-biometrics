#import "SimpleBiometricsKeyEncoding.h"

// Use an ephemeral software key so this format/signature test can run on macOS
// without biometric hardware. Production creates the same P-256 key in Secure Enclave.
int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 2) return 1;
    NSDictionary *attributes = @{
      (id)kSecAttrKeyType: (id)kSecAttrKeyTypeECSECPrimeRandom,
      (id)kSecAttrKeySizeInBits: @256,
    };
    CFErrorRef error = NULL;
    SecKeyRef key = SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &error);
    if (!key) {
      NSLog(@"Key generation failed: %@", (__bridge id)error);
      if (error) CFRelease(error);
      return 1;
    }
    SecKeyRef publicKey = SecKeyCopyPublicKey(key);
    NSData *spki = publicKey ? SimpleBiometricsCopyPublicKeySPKI(publicKey) : nil;
    if (publicKey) CFRelease(publicKey);
    NSData *payload = [@"nonce-123 — café 🔐" dataUsingEncoding:NSUTF8StringEncoding];
    CFDataRef signature = SecKeyCreateSignature(
      key, kSecKeyAlgorithmECDSASignatureMessageX962SHA256,
      (__bridge CFDataRef)payload, &error);
    CFRelease(key);
    if (!spki || !signature) {
      NSLog(@"Export/signing failed: %@", (__bridge id)error);
      if (error) CFRelease(error);
      if (signature) CFRelease(signature);
      return 1;
    }
    NSString *directory = [NSString stringWithUTF8String:argv[1]];
    BOOL success = [spki writeToFile:[directory stringByAppendingPathComponent:@"public.der"] atomically:YES]
      && [payload writeToFile:[directory stringByAppendingPathComponent:@"payload"] atomically:YES]
      && [(__bridge NSData *)signature writeToFile:[directory stringByAppendingPathComponent:@"signature.der"] atomically:YES];
    CFRelease(signature);
    return success ? 0 : 1;
  }
}
