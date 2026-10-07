import { Canvas, Picture, SkPicture } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { dayInfo, DayPhase, GAME, ItemKind } from '../game/config';
import { answerExit, createGame, crowdSize, cupsSold, resetGame, resizeGame, resetPaused, setJoystick, updateGame, visitorsFor } from '../game/engine';
import { BRIDGE4_S, EXIT_S, LABELS, nearestPlay, pointAt } from '../game/map';
import { renderGame } from '../game/render';
import { loadBest, saveBest } from '../game/storage';
import EndingCard, { EscapeHow } from './EndingCard';

interface Frame {
  picture: SkPicture;
  camX: number;
  camY: number;
  zoom: number;
  time: number;
  playTime: number;
  // 바다 출구까지 남은 거리(미터로 환산)
  exitMeters: number;
  // 하루 중 때(낮/해질녘/밤/새벽)
  phase: DayPhase;
}

interface Hud {
  score: number;
  lives: number;
  over: boolean;
  people: number;
  escaped: EscapeHow | null;
}

const phaseLabel = (p: DayPhase) =>
  p === 'day' ? '☀️ 낮' : p === 'dusk' ? '🌆 해질녘' : p === 'night' ? '🌙 밤' : '🌅 새벽';

export default function GameScreen() {
  // 게임 영역의 실제 크기: 웹에서는 창보다 좁은 세로 칸에 들어가므로 레이아웃으로 알아낸다.
  const win = useWindowDimensions();
  const [size, setSize] = useState({ width: win.width, height: win.height });
  const { width, height } = size;
  // 게임 상태는 매 프레임 바뀌므로 React state 가 아니라 변경 가능한 객체에 둔다.
  const [game] = useState(() => createGame(win.width, win.height));
  const [frame, setFrame] = useState<Frame | null>(null);
  const [hud, setHud] = useState<Hud>({ score: 0, lives: GAME.lives, over: false, people: crowdSize(0), escaped: null });
  // 방금 늘어난 구경꾼 수를 잠깐 보여준다.
  const [gain, setGain] = useState({ n: 0, until: 0 });
  // 생닭이 날아올 때 잠깐 띄우는 안내
  const [toast, setToast] = useState({ text: '', until: 0 });
  // 카페인 부스트가 끝나는 게임 시각
  const [boostUntil, setBoostUntil] = useState(0);
  // 만조가 끝나는 게임 시각
  const [tideUntil, setTideUntil] = useState(0);
  // 최고 기록과 방금 끝난 판의 결과
  const bestRef = useRef(0);
  const [result, setResult] = useState({ best: 0, prev: 0, isNew: false });
  // "바다로 나갈까요?" 질문이 떠 있는지
  const [exitPrompt, setExitPrompt] = useState(false);
  const [screen, setScreen] = useState<'title' | 'play'>('play');

  const restart = useCallback(() => {
    resetGame(game, width, height);
    setHud({ score: 0, lives: GAME.lives, over: false, people: crowdSize(0), escaped: null });
    setGain({ n: 0, until: 0 });
    setToast({ text: '', until: 0 });
    setBoostUntil(0);
    setTideUntil(0);
    setExitPrompt(false);
    setScreen('play');
  }, [game, width, height]);

  // 그만하기: 새 판을 준비해 두고 시작 화면에서 멈춘다.
  const quit = useCallback(() => {
    resetPaused(game, width, height);
    setHud({ score: 0, lives: GAME.lives, over: false, people: crowdSize(0), escaped: null });
    setGain({ n: 0, until: 0 });
    setToast({ text: '', until: 0 });
    setBoostUntil(0);
    setTideUntil(0);
    setExitPrompt(false);
    setScreen('title');
  }, [game, width, height]);

  // 저장해 둔 최고 기록을 불러온다.
  useEffect(() => {
    loadBest().then((best) => {
      if (best > bestRef.current) {
        bestRef.current = best;
        setResult((r) => ({ ...r, best }));
      }
    });
  }, []);

  // 웹에서 주소 끝에 ?debug 를 붙이면 게임 상태를 꺼내 볼 수 있게 한다. (스크린샷 촬영, 점검용)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.location.search.includes('debug')) return;
    (window as unknown as Record<string, unknown>).__bk = { game, pointAt, nearestPlay, EXIT_S, BRIDGE4_S };
  }, [game]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const events = {
      onEat: (_score: number, people: number) => {
        const g = game;
        setHud({ score: g.score, lives: g.lives, over: g.over, people: g.crowd.shown, escaped: g.escaped });
        if (people > 0) setGain({ n: people, until: game.time + 1.1 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onThrow: (kind: ItemKind) =>
        setToast({
          text:
            kind === 'coffee'
              ? '☕ 어디야 배달! 마시면 10초 부스트'
              : '🐔 생닭이 날아온다! 먹으면 ❤️ +1',
          until: game.time + 3.2,
        }),
      onBoost: (until: number) => {
        setBoostUntil(until);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      onExitPrompt: () => setExitPrompt(true),
      onPhase: (phase: DayPhase) => {
        const text =
          phase === 'dusk'
            ? '🌆 해가 지고 있어요'
            : phase === 'night'
              ? '🌙 밤이에요! 기슭의 불빛에 오래 비치면 하트가 깎여요'
              : phase === 'dawn'
                ? '🌅 날이 밝아 와요'
                : '';
        if (text) setToast({ text, until: game.time + 3.6 });
      },
      onNet: () =>
        setToast({ text: '🪢 그물 몰이 시작! 두 배 사이 빈틈으로 빠져나가세요', until: game.time + 3.4 }),
      onTide: (until: number) => {
        setTideUntil(until);
        setToast({ text: '🌊 만조! 지금은 그물을 넘을 수 있어요', until: game.time + 3 });
      },
      onEscape: (how: EscapeHow) => {
        const g = game;
        setHud({ score: g.score, lives: g.lives, over: g.over, people: g.crowd.shown, escaped: how });
        const prev = bestRef.current;
        bestRef.current = Math.max(prev, g.score);
        setResult({ best: bestRef.current, prev, isNew: g.score > prev });
        if (g.score > prev) saveBest(g.score);
        setExitPrompt(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      onHeal: () => {
        setHud({ score: game.score, lives: game.lives, over: game.over, people: game.crowd.shown, escaped: game.escaped });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      onHurt: () => {
        const g = game;
        setHud({ score: g.score, lives: g.lives, over: g.over, people: g.crowd.shown, escaped: g.escaped });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        if (g.over) {
          const prev = bestRef.current;
          bestRef.current = Math.max(prev, g.score);
          setResult({ best: bestRef.current, prev, isNew: g.score > prev });
          if (g.score > prev) saveBest(g.score);
        }
      },
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game;
      updateGame(g, dt, events);
      const exitMeters = Math.max(0, EXIT_S - nearestPlay(g.shark.x, g.shark.y).s) * 0.1;
      setFrame({
        picture: renderGame(g),
        camX: g.camera.x,
        camY: g.camera.y,
        zoom: g.zoom,
        time: g.time,
        playTime: g.playTime,
        exitMeters,
        phase: dayInfo(g.playTime).phase,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [game]);

  // 화면 어디든 터치한 지점을 중심으로 드래그하면 조이스틱처럼 동작한다.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => setJoystick(game, true, e.x, e.y, 0, 0))
        .onUpdate((e) => {
          const j = game.joystick;
          setJoystick(game, true, j.ox, j.oy, e.translationX, e.translationY);
        })
        .onFinalize(() => setJoystick(game, false)),
    [game],
  );

  // 북항 체류일: 0일에서 시작해 플레이 시간에 따라 늘어난다.
  const days = frame ? Math.floor(frame.playTime / GAME.secondsPerDay) : 0;

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (w > 0 && h > 0 && (w !== width || h !== height)) {
          setSize({ width: w, height: h });
          resizeGame(game, w, h);
        }
      }}>
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
            <Text
              key={l.dynamic ?? l.text}
              pointerEvents="none"
              style={[
                styles.label,
                l.dynamic === 'cups' && styles.cups,
                l.sign === 'title' && styles.signTitle,
                l.sign === 'sub' && styles.signSub,
                { left: sx - (l.dynamic ? 90 : 70), top: sy - (l.sign === 'title' ? 12 : l.sign === 'sub' ? 6 : 10) },
              ]}>
              {l.dynamic === 'cups' ? `☕ 오늘 ${cupsSold(hud.people).toLocaleString()}잔 판매` : l.text}
            </Text>
          );
        })}

      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.score}>{hud.score}</Text>
        <Text style={styles.lives}>
          {'❤️'.repeat(Math.max(0, hud.lives))}
          {'🖤'.repeat(Math.max(0, GAME.lives - hud.lives))}
        </Text>
        {frame && frame.time < boostUntil && (
          <Text style={styles.boost}>⚡ 카페인 부스트 {Math.ceil(boostUntil - frame.time)}초</Text>
        )}
        {frame && frame.time < tideUntil && (
          <Text style={styles.tide}>🌊 만조 {Math.ceil(tideUntil - frame.time)}초 · 그물을 넘을 수 있어요</Text>
        )}
        <Text style={styles.visitors}>
          👥 구경꾼 {hud.people}명
          {frame && frame.time < gain.until && <Text style={styles.gain}>  +{gain.n}</Text>}
        </Text>
        <Text style={styles.visitors}>오늘의 방문객 {visitorsFor(hud.score).toLocaleString()}명</Text>
        <Text style={styles.visitors}>
          북항 체류 {days}일째 · {phaseLabel(frame ? frame.phase : 'day')}
        </Text>
        {result.best > 0 && <Text style={styles.best}>🏆 최고 기록 {result.best}</Text>}
      </View>

      {frame && frame.time < toast.until && !hud.over && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast.text}</Text>
        </View>
      )}

      {frame && !hud.over && !hud.escaped && screen === 'play' && (
        <View style={styles.exitPill} pointerEvents="none">
          <Text style={styles.exitText}>🌊 외해 출구까지 {Math.round(frame.exitMeters)}m ↓</Text>
        </View>
      )}

      {exitPrompt && !hud.over && !hud.escaped && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🌊</Text>
            <Text style={styles.cardTitle}>바다로 나갈까요?</Text>
            <Text style={styles.cardSub}>
              넓은 바다로 나가면 이번 판이 끝나고 엔딩을 볼 수 있어요.{'\n'}더 머물면서 점수를 올릴 수도 있어요.
            </Text>
            <Text style={styles.ask}>현재 점수 {hud.score}</Text>
            <View style={styles.buttons}>
              <Pressable
                style={[styles.button, styles.buttonGhost]}
                onPress={() => {
                  setExitPrompt(false);
                  answerExit(game, false);
                }}>
                <Text style={styles.buttonGhostText}>더 머물기</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonMain]}
                onPress={() => {
                  setExitPrompt(false);
                  answerExit(game, true);
                }}>
                <Text style={styles.buttonText}>바다로 나가기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {hud.escaped && (
        <EndingCard
          how={hud.escaped}
          score={hud.score}
          days={days}
          people={hud.people}
          visitors={visitorsFor(hud.score)}
          cups={cupsSold(hud.people)}
          lives={hud.lives}
          best={result.best}
          prevBest={result.prev}
          isNewBest={result.isNew}
          onRetry={restart}
          onQuit={quit}
        />
      )}

      {hud.over && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🦈</Text>
            <Text style={styles.cardTitle}>게임 종료</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{hud.score}</Text>
                <Text style={styles.statLabel}>점수</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{hud.people}</Text>
                <Text style={styles.statLabel}>구경꾼</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{result.best}</Text>
                <Text style={styles.statLabel}>최고 기록</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>
              북항 체류 {days}일 · 방문객 {visitorsFor(hud.score).toLocaleString()}명
            </Text>
            {result.isNew && <Text style={styles.newBest}>🏆 최고 기록 갱신!</Text>}
            <Text style={styles.ask}>다시 도전할까요?</Text>
            <View style={styles.buttons}>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={quit}>
                <Text style={styles.buttonGhostText}>그만하기</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonMain]} onPress={restart}>
                <Text style={styles.buttonText}>다시 하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {screen === 'title' && (
        <View style={[styles.overlay, styles.titleOverlay]}>
          <Text style={styles.titleEmoji}>🦈</Text>
          <Text style={styles.titleName}>북항이</Text>
          <Text style={styles.titleSub}>북항 친수공원 수로에 갇힌 아기 상어{'\n'}배고픈 북항이를 도와주세요!</Text>
          {result.best > 0 && <Text style={styles.titleBest}>🏆 최고 기록 {result.best}</Text>}
          <Pressable style={[styles.button, styles.buttonMain, styles.startButton]} onPress={restart}>
            <Text style={styles.buttonText}>게임 시작</Text>
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
  },
  score: { color: '#fff', fontSize: 40, fontWeight: '800' },
  visitors: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  lives: { fontSize: 22, marginTop: 2, marginBottom: 4 },
  signTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowRadius: 0,
  },
  cups: {
    width: 180,
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: '#1f3f77',
    borderColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 4,
    textShadowRadius: 0,
  },
  signSub: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#bfe6f5',
    textShadowRadius: 0,
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,251,232,0.95)',
    borderColor: '#2a3342',
    borderWidth: 3,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toastText: { fontSize: 15, fontWeight: '900', color: '#2a3342' },
  tide: { color: '#9fe3ff', fontSize: 14, fontWeight: '900', marginBottom: 2 },
  exitPill: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(8,40,70,0.55)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  exitText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  best: { color: '#ffe066', fontSize: 13, fontWeight: '800', marginTop: 2 },
  boost: { color: '#ffd34a', fontSize: 15, fontWeight: '900', marginBottom: 2 },
  gain: { color: '#ffe066', fontWeight: '800' },
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
    backgroundColor: 'rgba(5,25,45,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff8e8',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#2a3342',
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 44 },
  cardTitle: { fontSize: 28, fontWeight: '900', color: '#2a3342', marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 18, gap: 10, width: '100%' },
  stat: {
    flex: 1,
    backgroundColor: '#e6f3fb',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1f4d6e' },
  statLabel: { fontSize: 12, color: '#4a6a80', marginTop: 2, fontWeight: '700' },
  cardSub: { marginTop: 14, fontSize: 14, color: '#5a6a78' },
  newBest: { marginTop: 10, fontSize: 16, fontWeight: '900', color: '#d9822b' },
  ask: { marginTop: 20, fontSize: 20, fontWeight: '800', color: '#2a3342' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#2a3342',
    alignItems: 'center',
  },
  buttonMain: { backgroundColor: '#ffd35a' },
  buttonGhost: { backgroundColor: '#ffffff' },
  buttonText: { fontSize: 18, fontWeight: '900', color: '#3a2a00' },
  buttonGhostText: { fontSize: 18, fontWeight: '800', color: '#4a5a68' },
  titleOverlay: { backgroundColor: 'rgba(8,40,70,0.72)' },
  titleEmoji: { fontSize: 72 },
  titleName: { fontSize: 56, fontWeight: '900', color: '#ffffff', letterSpacing: 4, marginTop: 4 },
  titleSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 10, lineHeight: 24 },
  titleBest: { marginTop: 18, fontSize: 18, fontWeight: '800', color: '#ffe066' },
  startButton: { flex: 0, alignSelf: 'stretch', marginTop: 32, marginHorizontal: 40 },
});
