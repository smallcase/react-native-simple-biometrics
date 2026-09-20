#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
xcrun --sdk macosx clang++ -fobjc-arc -Wall -Wextra -Werror \
  -framework Foundation -framework Security -I "$repo_root/ios" \
  "$repo_root/tests/native/ios-key-encoding.mm" -o "$test_dir/export-key"
"$test_dir/export-key" "$test_dir"
node - "$test_dir" <<'JS'
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createPublicKey, verify } = require('node:crypto');
const directory = process.argv[2];
const key = createPublicKey({
  key: readFileSync(`${directory}/public.der`),
  format: 'der',
  type: 'spki',
});
assert.equal(key.asymmetricKeyType, 'ec');
assert.equal(key.asymmetricKeyDetails.namedCurve, 'prime256v1');
const payload = readFileSync(`${directory}/payload`);
const signature = readFileSync(`${directory}/signature.der`);
assert(verify('sha256', payload, key, signature));
assert(!verify('sha256', Buffer.concat([payload, Buffer.from('tampered')]), key, signature));
console.log('PASS: Apple P-256 SPKI import, ECDSA/SHA-256 verification, and tampered payload rejection');
JS
