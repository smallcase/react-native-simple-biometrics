import React, {useState, useCallback} from 'react';
import {View, Button, Text} from 'react-native';
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
        'title',
        'subtitle -- ',
      );
      setAuthenticated(success);
    } catch (err) {
      setAuthenticated(false);
    }
  }, []);

  return (
    <View style={{margin: 16}}>
      <Button title="check can authenticate" onPress={checkCanAuth} />
      <Text>
        {'can authenticate : '}
        {canAuth === null ? 'not checked' : canAuth ? 'yes' : 'no'}
      </Text>
      <View style={{height: 16}} />
      <Button title="authenticate" onPress={authenticate} />
      <Text>
        {'authenticated : '}
        {authenticated === null ? 'not checked' : authenticated ? 'yes' : 'no'}
      </Text>
    </View>
  );
};

export default App;
