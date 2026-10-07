import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// 웹에서는 Skia(CanvasKit) 를 먼저 불러온 뒤에 앱을 시작한다.
// canvaskit.wasm 은 public/ 폴더에 들어 있다. (npx setup-skia-web 으로 복사)
export async function loadSkia(): Promise<void> {
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
}
