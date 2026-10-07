import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GameScreen from './src/components/GameScreen';

// 세로 화면 게임이라, 넓은 화면(PC 웹 등)에서는 가운데 세로 칸에만 게임을 보여 준다.
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.column}>
        <GameScreen />
      </View>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: '#06222f' },
  column: { flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden' },
});
