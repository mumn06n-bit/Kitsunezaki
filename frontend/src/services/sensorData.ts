// 各画面共通のセンサーデータ取得処理
// バックエンド(/api/sensors)で統合済みのJSONを取得する

export type SensorRecord = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
};

// 同じ日付のデータを複数の画面から要求されても、一定時間は通信を1回で済ませる
const CACHE_MS = 60 * 1000;
const cache = new Map<string, { request: Promise<SensorRecord[]>; fetchedAt: number }>();

// Date → "YYYY-MM-DD"
export const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// date を省略すると全期間を取得
export const fetchSensorData = (date?: Date) => {
  const dateString = date ? toDateString(date) : "";

  const cached = cache.get(dateString);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached.request;
  }
  const url = dateString ? `/api/sensors?date=${dateString}` : "/api/sensors";

  const request = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SensorRecord[];
  });

  // 失敗したときはキャッシュに残さない（次回また取りに行く）
  request.catch(() => cache.delete(dateString));
  cache.set(dateString, { request, fetchedAt: Date.now() });

  return request;
};
