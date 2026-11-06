import { useContext } from 'react';
import { View } from 'react-native';
import { Choice } from './FormControls';
import { ThemeContext } from '../styles/theme';

export function NavigationTabs({ screen, setScreen, isSystemAdmin, isOrgAdmin, hasMeetingsAccess, onOpenMeetings, onOpenReport, onOpenManual, onOpenProfile }) {
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
      {hasMeetingsAccess && (
        <Choice label="Reuniões" active={screen === 'meetings'} onPress={onOpenMeetings} />
      )}
      {hasMeetingsAccess && (
        <Choice label="Meu relatório" active={screen === 'meeting-report'} onPress={onOpenReport} />
      )}
      <Choice label="Manual" active={screen === 'manual'} onPress={onOpenManual} />
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
