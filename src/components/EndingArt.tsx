import { useEffect, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export type EndingKind = 'lightning' | 'brave' | 'proud' | 'legend' | 'netted';

// 엔딩 일러스트: scripts/endings/build.mjs 로 만든 PNG (1200x750)
const ILLUSTRATIONS: Record<EndingKind, ImageSourcePropType> = {
  lightning: require('../../assets/endings/lightning.png'),
  brave: require('../../assets/endings/brave.png'),
  proud: require('../../assets/endings/proud.png'),
  legend: require('../../assets/endings/legend.png'),
  netted: require('../../assets/endings/netted.png'),
};

const ASPECT = 750 / 1200;

interface Props {
  kind: EndingKind;
  width: number;
}

// 일러스트가 서서히 나타나고, 천천히 다가가는 듯한 연출을 준다.
export default function EndingArt({ kind, width }: Props) {
  const [fade] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, { toValue: 1.07, duration: 9000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(zoom, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, zoom]);

  return (
    <View style={[styles.frame, { width, height: width * ASPECT }]}>
      <Animated.View style={{ opacity: fade, transform: [{ scale: zoom }] }}>
        <Image source={ILLUSTRATIONS[kind]} style={{ width, height: width * ASPECT }} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 18, overflow: 'hidden', borderWidth: 3, borderColor: '#2a3342', backgroundColor: '#17566e' },
});
