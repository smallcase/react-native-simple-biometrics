import React, {useState, useCallback} from 'react';
import {Text, SafeAreaView, TouchableOpacity} from 'react-native';
import RNBiometrics from 'react-native-simple-biometrics';

const App = () => {
  const [canAuth, setCanAuth] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);

  const checkCanAuth = useCallback(async () => {
    const success = await RNBiometrics.canAuthenticate();
    setCanAuth(success);
  }, []);

  const authenticate = useCallback(async () => {
    try {
      const success = await RNBiometrics.requestBioAuth(
        'Security',
        'Authenticate to View',
      );
      setAuthenticated(success);
    } catch (err) {
      console.log(err);
      setAuthenticated(false);
    }
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        margin: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <TouchableOpacity
        onPress={authenticate}
        style={{
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          backgroundColor: '#fa7e61',
        }}>
        <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
          Bank Balance
        </Text>
        <Text style={{color: '#6F1D1B', padding: 12}}>
          {authenticated ? '🔓' : '🔒'}
        </Text>
        <Text style={{color: '#6F1D1B'}}>
          {authenticated ? '$1,000,000' : '(tap to unlock)'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default App;
