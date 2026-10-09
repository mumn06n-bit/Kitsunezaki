
export type SensorPosition = {
  latitude: number | null;
  longitude: number | null;
  latitudeDMS: string | null;
  longitudeDMS: string | null;
};

export type SensorRecord = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;

  positions?: {
    salinity: SensorPosition;
    DO01: SensorPosition;
    DO02: SensorPosition;
    DO03: SensorPosition;
  };
};

// 同じ日付のデータは60秒間キャッシュする
const CACHE_MS = 60 * 1000;

const cache = new Map<
  string,
  {
    request: Promise<SensorRecord[]>;
    fetchedAt: number;
  }
>();

// DateをYYYY-MM-DDに変換する
export const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// センサーデータを取得する
export const fetchSensorData = (
  date?: Date
): Promise<SensorRecord[]> => {
  const dateString = date ? toDateString(date) : "";

  const cached = cache.get(dateString);

  // キャッシュが有効なら、保存済みのリクエストを再利用する
  if (
    cached &&
    Date.now() - cached.fetchedAt < CACHE_MS
  ) {
    return cached.request;
  }

  const url = dateString
    ? `/api/sensors?date=${dateString}`
    : "/api/sensors";

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`
        );
      }

      return (await response.json()) as SensorRecord[];
    })
    .catch((error) => {
      // 失敗したリクエストをキャッシュに残さない
      cache.delete(dateString);
      throw error;
    });

  cache.set(dateString, {
    request,
    fetchedAt: Date.now(),
  });

  return request;
};