import { Canvas, Picture, SkPicture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { GAME } from '../game/config';
import { createGame, GameState, setJoystick, updateGame, visitorsFor } from '../game/engine';
import { renderGame } from '../game/render';

interface Hud {
  score: number;
  lives: number;
  over: boolean;
}

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const game = useRef<GameState>(createGame(width, height));
  const [picture, setPicture] = useState<SkPicture | null>(null);
  const [hud, setHud] = useState<Hud>({ score: 0, lives: GAME.lives, over: false });
  const [best, setBest] = useState(0);

  const restart = useCallback(() => {
    game.current = createGame(width, height);
    setHud({ score: 0, lives: GAME.lives, over: false });
  }, [width, height]);

  // 화면 크기가 바뀌면(회전 등) 게임을 새로 시작한다.
  useEffect(() => {
    restart();
  }, [restart]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const events = {
      onEat: () => {
        const g = game.current;
        setHud({ score: g.score, lives: g.lives, over: g.over });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onHurt: () => {
        const g = game.current;
        setHud({ score: g.score, lives: g.lives, over: g.over });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        if (g.over) setBest((b) => Math.max(b, g.score));
      },
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game.current;
      updateGame(g, dt, events);
      setPicture(renderGame(g));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 화면 어디든 터치한 지점을 중심으로 드래그하면 조이스틱처럼 동작한다.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => setJoystick(game.current, true, e.x, e.y, 0, 0))
        .onUpdate((e) => {
          const j = game.current.joystick;
          setJoystick(game.current, true, j.ox, j.oy, e.translationX, e.translationY);
        })
        .onFinalize(() => setJoystick(game.current, false)),
    [],
  );

  return (
    <View style={styles.root}>
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>{picture && <Picture picture={picture} />}</Canvas>
        </View>
      </GestureDetector>

      <View style={styles.hud} pointerEvents="none">
        <View>
          <Text style={styles.score}>{hud.score}</Text>
          <Text style={styles.visitors}>
            오늘의 방문객 {visitorsFor(hud.score).toLocaleString()}명
          </Text>
        </View>
        <Text style={styles.lives}>{'❤️'.repeat(hud.lives) || '💀'}</Text>
      </View>

      {hud.over && (
        <View style={styles.overlay}>
          <Text style={styles.overTitle}>게임 오버</Text>
          <Text style={styles.overScore}>점수 {hud.score}</Text>
          <Text style={styles.overScore}>최고 {best}</Text>
          <Pressable style={styles.button} onPress={restart}>
            <Text style={styles.buttonText}>다시 시작</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#17566e' },
  hud: {
    position: 'absolute',
    top: 54,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  score: { color: '#fff', fontSize: 40, fontWeight: '800' },
  visitors: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  lives: { fontSize: 22 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overTitle: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 8 },
  overScore: { color: '#fff', fontSize: 20 },
  button: {
    marginTop: 20,
    backgroundColor: '#ffd35a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonText: { fontSize: 18, fontWeight: '800', color: '#3a2a00' },
});
