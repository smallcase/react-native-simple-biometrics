import React, { useState, useCallback, useEffect } from 'react';
import {
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import RNBiometrics from 'react-native-simple-biometrics';

const App = () => {
  const [canAuth, setCanAuth] = useState(false);
  const [type, setType] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    RNBiometrics.canAuthenticate().then(setCanAuth);
  }, []);

  useEffect(() => {
    if (!canAuth) {
      setType('Unknown');
      return;
    }
    RNBiometrics.getBiometryType().then(setType);
  }, [canAuth]);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fa7e61" />
      <TouchableOpacity onPress={authenticate} style={styles.button}>
        <Text style={styles.title}>Bank Balance</Text>
        {canAuth ? (
          <>
            <Text style={[styles.subtitle, styles.amount]}>
              {authenticated ? '🔓' : '🔒'}
            </Text>
            <Text style={styles.subtitle}>
              {authenticated ? '$1,000,000' : `(tap to unlock using ${type})`}
            </Text>
          </>
        ) : (
          <Text style={[styles.subtitle, styles.amount]}>
            Error, can't use biometrics to authenticate
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5e548e',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fa7e61',
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
});

export default App;
