import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import EndingArt, { EndingKind } from './EndingArt';

export type EscapeHow = 'swam' | 'netted';

interface Props {
  how: EscapeHow;
  score: number;
  days: number;
  people: number;
  visitors: number;
  cups: number;
  lives: number;
  // 최고 기록(이번 판 포함), 이번 판 이전의 최고 기록, 이번에 새로 깼는지
  best: number;
  prevBest: number;
  isNewBest: boolean;
  onRetry: () => void;
  onQuit: () => void;
}

interface Ending {
  kind: EndingKind;
  emoji: string;
  title: string;
  story: string;
  // 엔딩마다 다른 마지막 한 줄
  epilogue: string;
}

// 엔딩은 어떻게 나갔는지, 얼마나 인기를 끌었는지에 따라 달라진다.
function pickEnding(p: Props): Ending {
  if (p.how === 'netted') {
    return {
      kind: 'netted',
      emoji: '🪢',
      epilogue: '떠나는 길은 아쉬웠지만, 북항이는 새 바다에서 다시 힘차게 헤엄칠 거예요.',
      title: '그물에 몰려 바다로…',
      story: `작업선의 그물에 밀려 결국 외해로 나왔어요.\n북항이는 ${p.days}일 동안 지낸 수로를 한참 돌아봤답니다.`,
    };
  }
  if (p.days === 0 && p.score < 50) {
    return {
      kind: 'lightning',
      emoji: '💨',
      epilogue: '너무 빨리 떠난 북항이를, 구경꾼들은 한참 동안 수로 쪽을 바라보며 기다렸어요.',
      title: '번개 탈출',
      story: '하루도 안 돼 바다로 쏜살같이 나갔어요!\n다음엔 구경꾼들과 조금 더 놀다 가도 좋겠죠?',
    };
  }
  if (p.score >= 600) {
    return {
      kind: 'legend',
      emoji: '🏆',
      epilogue: '그날 밤 북항의 불꽃은 사람들의 기억 속에서 오래도록 반짝였어요.',
      title: '전설의 북항이',
      story: `방문객 ${p.visitors.toLocaleString()}명, 어디야 ${p.cups.toLocaleString()}잔 완판!\n북항의 전설이 된 북항이가 구경꾼들에게 꼬리를 흔들며 바다로 돌아갔어요.`,
    };
  }
  if (p.score >= 150) {
    return {
      kind: 'proud',
      emoji: '👏',
      epilogue: '박수 소리는 파도 소리에 섞여 오래도록 북항에 울려 퍼졌답니다.',
      title: '당당한 퇴장',
      story: `${p.days}일 동안 북항을 지킨 북항이!\n구경꾼 ${p.people}명의 박수를 받으며 넓은 바다로 향했어요.`,
    };
  }
  return {
    kind: 'brave',
    emoji: '🌊',
    epilogue: '작은 용기 하나가 북항이를 더 넓은 바다로 이끌어 주었어요.',
    title: '용기 낸 탈출',
    story: '배고픈 채로 용기를 내 바다로 나갔어요.\n더 넓은 바다에서 배불리 먹을 수 있을 거예요.',
  };
}

export default function EndingCard(props: Props) {
  const ending = pickEnding(props);
  const { width, height } = useWindowDimensions();
  // 카드 안쪽 너비에 맞춰 그림 크기를 정한다. (카드 최대 380, 좌우 여백과 테두리 제외)
  const cardWidth = Math.min(380, width - 40);
  const artWidth = cardWidth - 48;
  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { maxHeight: height * 0.92 }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EndingArt kind={ending.kind} width={artWidth} />
        <Text style={styles.kicker}>{ending.emoji} ENDING</Text>
        <Text style={styles.title}>{ending.title}</Text>
        <Text style={styles.story}>{ending.story}</Text>

        <View style={styles.stats}>
          <Stat value={props.score} label="점수" />
          <Stat value={props.days} label="체류일" />
          <Stat value={props.people} label="구경꾼" />
          <Stat value={props.lives} label="남은 ❤️" />
        </View>

        <View style={[styles.recordBox, props.isNewBest && styles.recordBoxNew]}>
          {props.isNewBest ? (
            <Text style={styles.recordNew}>
              🏆 최고 기록 갱신! {props.prevBest > 0 ? `(이전 ${props.prevBest}점)` : '(첫 기록)'}
            </Text>
          ) : (
            <Text style={styles.record}>
              🏅 최고 기록 {props.best}점 · 이번 {props.score}점
              {props.best > props.score ? ` (${props.best - props.score}점 부족)` : ''}
            </Text>
          )}
        </View>

        <Text style={styles.epilogue}>{ending.epilogue}</Text>
        <Text style={styles.epilogueMascot}>
          북항이는 이제 모두의 마음속 마스코트로 오래오래 남기로 했어요.
        </Text>

        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.ghost]} onPress={props.onQuit}>
            <Text style={styles.ghostText}>그만하기</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.main]} onPress={props.onRetry}>
            <Text style={styles.mainText}>다시 하기</Text>
          </Pressable>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,170,90,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff8e8',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#2a3342',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  content: { alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 6, color: '#d9822b', marginTop: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#2a3342', marginTop: 2, textAlign: 'center' },
  story: { fontSize: 15, lineHeight: 22, color: '#3d4a58', textAlign: 'center', marginTop: 12 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' },
  stat: { flex: 1, backgroundColor: '#e6f3fb', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1f4d6e' },
  statLabel: { fontSize: 11, color: '#4a6a80', marginTop: 2, fontWeight: '700' },
  recordBox: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
  },
  recordBoxNew: { backgroundColor: '#fff0c2', borderWidth: 2, borderColor: '#f2b52e' },
  record: { fontSize: 13, fontWeight: '800', color: '#4a5a68' },
  recordNew: { fontSize: 15, fontWeight: '900', color: '#c9741a' },
  epilogue: { fontSize: 14, lineHeight: 20, color: '#4a5a68', textAlign: 'center', marginTop: 14, fontWeight: '700' },
  epilogueMascot: { fontSize: 12, lineHeight: 18, color: '#7a8794', textAlign: 'center', marginTop: 6 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 18, width: '100%' },
  button: { flex: 1, paddingVertical: 15, borderRadius: 22, borderWidth: 3, borderColor: '#2a3342', alignItems: 'center' },
  main: { backgroundColor: '#ffd35a' },
  ghost: { backgroundColor: '#ffffff' },
  mainText: { fontSize: 18, fontWeight: '900', color: '#3a2a00' },
  ghostText: { fontSize: 18, fontWeight: '800', color: '#4a5a68' },
});
