import { useContext } from 'react';
import { View } from 'react-native';
import { Choice } from './FormControls';
import { ThemeContext } from '../styles/theme';

export function NavigationTabs({ screen, setScreen, isSystemAdmin, isOrgAdmin, onOpenProfile }) {
  const { styles } = useContext(ThemeContext);

  return (
    <View style={styles.navigation}>
      {!isSystemAdmin && (
        <Choice
          label="Organizações"
          active={screen === 'organizations'}
          onPress={() => setScreen('organizations')}
        />
      )}
      {!isSystemAdmin && (
        <Choice
          label="Minha organização"
          active={screen === 'management'}
          onPress={() => setScreen('management')}
        />
      )}
      {isOrgAdmin && (
        <Choice
          label="Comissões"
          active={screen === 'commissions'}
          onPress={() => setScreen('commissions')}
        />
      )}
      {isSystemAdmin && (
        <Choice
          label="Gestão"
          active={screen === 'admin-management'}
          onPress={() => setScreen('admin-management')}
        />
      )}
      {isSystemAdmin && (
        <Choice
          label="Sistema"
          active={screen === 'system'}
          onPress={() => setScreen('system')}
        />
      )}
      <Choice
        label="Perfil"
        active={screen === 'profile'}
        onPress={onOpenProfile}
      />
    </View>
  );
}
