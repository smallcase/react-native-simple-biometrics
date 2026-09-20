#pragma once

#import <Foundation/Foundation.h>
#import <Security/Security.h>

// Security exports P-256 public keys as an uncompressed X9.63 point. Wrap it
// with the id-ecPublicKey and prime256v1 identifiers for DER SubjectPublicKeyInfo.
static NSData *SimpleBiometricsCopyPublicKeySPKI(SecKeyRef publicKey) {
  CFDataRef representation = SecKeyCopyExternalRepresentation(publicKey, NULL);
  if (!representation) {
    return nil;
  }
  NSData *point = CFBridgingRelease(representation);
  if (point.length != 65 || ((const uint8_t *)point.bytes)[0] != 0x04) {
    return nil;
  }

  static const uint8_t prefix[] = {
    0x30, 0x59, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    0x03, 0x42, 0x00,
  };
  NSMutableData *spki = [NSMutableData dataWithBytes:prefix length:sizeof(prefix)];
  [spki appendData:point];
  return spki;
}
