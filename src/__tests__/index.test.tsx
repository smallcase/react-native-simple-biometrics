import RNBiometrics from '../index';

jest.mock('../NativeSimpleBiometrics', () => ({
  __esModule: true,
  default: {
    canAuthenticate: jest.fn(),
    requestBioAuth: jest.fn(),
    createKeys: jest.fn(),
    biometricKeysExist: jest.fn(),
    deleteKeys: jest.fn(),
    createSignature: jest.fn(),
  },
}));

import SimpleBiometrics from '../NativeSimpleBiometrics';

describe('key generation and signatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createKeys uses a default key name', async () => {
    (SimpleBiometrics.createKeys as jest.Mock).mockResolvedValue({
      keyName: 'default',
      publicKey: 'abc',
      algorithm: 'RSA',
    });

    await RNBiometrics.createKeys();

    expect(SimpleBiometrics.createKeys).toHaveBeenCalledWith('default');
  });

  it('createKeys passes a custom key name', async () => {
    (SimpleBiometrics.createKeys as jest.Mock).mockResolvedValue({
      keyName: 'signing',
      publicKey: 'abc',
      algorithm: 'RSA',
    });

    await RNBiometrics.createKeys({ keyName: 'signing' });

    expect(SimpleBiometrics.createKeys).toHaveBeenCalledWith('signing');
  });

  it('biometricKeysExist uses a default key name', async () => {
    (SimpleBiometrics.biometricKeysExist as jest.Mock).mockResolvedValue(true);

    await RNBiometrics.biometricKeysExist();

    expect(SimpleBiometrics.biometricKeysExist).toHaveBeenCalledWith('default');
  });

  it('deleteKeys uses a default key name', async () => {
    (SimpleBiometrics.deleteKeys as jest.Mock).mockResolvedValue(false);

    await RNBiometrics.deleteKeys();

    expect(SimpleBiometrics.deleteKeys).toHaveBeenCalledWith('default');
  });

  it('createSignature applies defaults for key name and prompt message', async () => {
    (SimpleBiometrics.createSignature as jest.Mock).mockResolvedValue({
      keyName: 'default',
      publicKey: 'abc',
      signature: 'sig',
    });

    await RNBiometrics.createSignature('payload');

    expect(SimpleBiometrics.createSignature).toHaveBeenCalledWith(
      'default',
      'payload',
      'Authenticate to sign'
    );
  });

  it('createSignature passes custom key name and prompt message', async () => {
    (SimpleBiometrics.createSignature as jest.Mock).mockResolvedValue({
      keyName: 'signing',
      publicKey: 'abc',
      signature: 'sig',
    });

    await RNBiometrics.createSignature('payload', {
      keyName: 'signing',
      promptMessage: 'Sign in',
    });

    expect(SimpleBiometrics.createSignature).toHaveBeenCalledWith(
      'signing',
      'payload',
      'Sign in'
    );
  });

  it('createSignature rejects an empty payload', () => {
    expect(() => RNBiometrics.createSignature('')).toThrow(
      'payload must be a non empty string'
    );
  });
});
