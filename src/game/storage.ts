import AsyncStorage from '@react-native-async-storage/async-storage';

// 최고 기록은 기기 안에만 저장한다. (서버로 보내지 않는다)
const BEST_KEY = 'bukhangi.bestScore.v1';

export async function loadBest(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BEST_KEY);
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function saveBest(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BEST_KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    // 저장에 실패해도 게임은 계속된다.
  }
}
