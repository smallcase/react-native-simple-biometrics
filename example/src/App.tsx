import { useState, useCallback, useEffect } from 'react';
import {
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import RNBiometrics from 'react-native-simple-biometrics';

const App = () => {
  const [canAuth, setCanAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInfo, setKeyInfo] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    RNBiometrics.canAuthenticate().then(setCanAuth);
  }, []);

  const authenticate = useCallback(async () => {
    try {
      const success = await RNBiometrics.requestBioAuth(
        'Security',
        'Authenticate to View'
      );
      setAuthenticated(success);
    } catch (err) {
      console.log(err);
      setAuthenticated(false);
    }
  }, []);

  const createKeys = useCallback(async () => {
    try {
      const { publicKey, algorithm, keyName } = await RNBiometrics.createKeys();
      setKeyInfo(`${algorithm} key "${keyName}" created\n${publicKey}`);
    } catch (err) {
      setKeyInfo(`Error: ${err}`);
    }
  }, []);

  const sign = useCallback(async () => {
    try {
      const { signature: sig } = await RNBiometrics.createSignature('payload', {
        promptMessage: 'Sign the payload',
      });
      setSignature(sig);
    } catch (err) {
      setSignature(`Error: ${err}`);
    }
  }, []);

  const deleteKeys = useCallback(async () => {
    const deleted = await RNBiometrics.deleteKeys();
    setKeyInfo(deleted ? 'Keys deleted' : 'No keys to delete');
    setSignature('');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fa7e61" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={authenticate} style={styles.button}>
          <Text style={styles.title}>Bank Balance</Text>
          {canAuth ? (
            <>
              <Text style={[styles.subtitle, styles.amount]}>
                {authenticated ? '🔓' : '🔒'}
              </Text>
              <Text style={styles.subtitle}>
                {authenticated ? '$1,000,000' : '(tap to unlock)'}
              </Text>
            </>
          ) : (
            <Text style={[styles.subtitle, styles.amount]}>
              Error, can't use biometrics to authenticate
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={createKeys} style={styles.button}>
          <Text style={styles.title}>Create Keys</Text>
          {keyInfo ? (
            <Text style={styles.code}>{keyInfo}</Text>
          ) : (
            <Text style={styles.subtitle}>(tap to generate)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={sign} style={styles.button}>
          <Text style={styles.title}>Sign Payload</Text>
          {signature ? (
            <Text style={styles.code}>{signature}</Text>
          ) : (
            <Text style={styles.subtitle}>(tap to sign)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={deleteKeys} style={styles.button}>
          <Text style={styles.title}>Delete Keys</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5e548e',
  },
  scroll: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fa7e61',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6F1D1B',
  },
  amount: {
    padding: 12,
  },
  code: {
    color: '#6F1D1B',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default App;
