// 모바일(iOS/Android)에서는 Skia 를 따로 불러올 필요가 없다.
// 웹은 loadSkia.web.ts 가 대신 쓰인다.
export async function loadSkia(): Promise<void> {}
