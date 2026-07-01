import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/AuthContext';
import { colors } from '../src/theme';

// Equivalente a front/js/authGuard.js: decide se manda pra Home (sessão presente
// no AsyncStorage, no lugar do localStorage do navegador) ou pro Login.
export default function Index() {
  const styles = makeStyles();
  const { session } = useAuth();

  if (session === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue600} />
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/login'} />;
}

const makeStyles = () => StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pageBg,
  },
});
