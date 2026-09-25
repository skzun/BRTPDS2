import { useContext } from 'react';
import { Image, Text, View } from 'react-native';
import { ThemeContext } from '../styles/theme';

export function AppHeader({ userName }) {
  const { styles } = useContext(ThemeContext);
  const initial = userName ? userName.trim().charAt(0).toUpperCase() : 'S';

  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <Image
          source={require('../../assets/synple-splash.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.brand}>Synple</Text>
          <Text style={styles.subtitle}>Gestão de organizações</Text>
        </View>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    </View>
  );
}
