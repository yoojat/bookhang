import { registerRootComponent } from 'expo';

import { loadSkia } from './src/loadSkia';

// 웹에서는 Skia 를 먼저 불러온 뒤에 앱을 불러와야 해서 App 은 그 다음에 가져온다.
loadSkia().then(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  registerRootComponent(require('./App').default);
});
