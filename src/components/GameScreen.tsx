import { Canvas, Picture, SkPicture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { GAME } from '../game/config';
import { createGame, GameState, setJoystick, updateGame, visitorsFor } from '../game/engine';
import { LABELS } from '../game/map';
import { renderGame } from '../game/render';

// 부캉이가 북항 친수공원 수로에 처음 나타난 날 (2026-09-18)
const SHARK_ARRIVED = new Date(2026, 8, 18).getTime();
const daysSinceArrival = () => Math.max(1, Math.floor((Date.now() - SHARK_ARRIVED) / 86400000) + 1);

interface Frame {
  picture: SkPicture;
  camX: number;
  camY: number;
  zoom: number;
}

interface Hud {
  score: number;
  lives: number;
  over: boolean;
}

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const game = useRef<GameState>(createGame(width, height));
  const [frame, setFrame] = useState<Frame | null>(null);
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
      setFrame({ picture: renderGame(g), camX: g.camera.x, camY: g.camera.y, zoom: g.zoom });
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
          <Canvas style={StyleSheet.absoluteFill}>{frame && <Picture picture={frame.picture} />}</Canvas>
        </View>
      </GestureDetector>

      {frame &&
        LABELS.map((l) => {
          const sx = (l.x - frame.camX) * frame.zoom + width / 2;
          const sy = (l.y - frame.camY) * frame.zoom + height / 2;
          if (sx < -80 || sx > width + 80 || sy < -30 || sy > height + 30) return null;
          return (
            <Text key={l.text} pointerEvents="none" style={[styles.label, { left: sx - 70, top: sy - 10 }]}>
              {l.text}
            </Text>
          );
        })}

      <View style={styles.hud} pointerEvents="none">
        <View>
          <Text style={styles.score}>{hud.score}</Text>
          <Text style={styles.visitors}>
            오늘의 방문객 {visitorsFor(hud.score).toLocaleString()}명
          </Text>
          <Text style={styles.visitors}>북항 체류 {daysSinceArrival()}일째</Text>
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
  label: {
    position: 'absolute',
    width: 140,
    textAlign: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
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
