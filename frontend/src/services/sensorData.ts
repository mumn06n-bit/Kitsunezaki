
export type SensorPosition = {
  latitude: number | null;
  longitude: number | null;
  latitudeDMS: string | null;
  longitudeDMS: string | null;
};

export type PositionKey = "salinity" | "DO01" | "DO02" | "DO03";

export type LatestSensorPositions = {
  positions: Record<PositionKey, SensorPosition>;
  datetime: string | null;
  positionDatetimes: Partial<Record<PositionKey, string>>;
};

export type SensorRecord = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
  positions?: Record<PositionKey, SensorPosition>;
};

const CACHE_MS = 60 * 1000;

const cache = new Map<
  string,
  { request: Promise<SensorRecord[]>; fetchedAt: number }
>();

let latestPositionsCache:
  | { request: Promise<LatestSensorPositions>; fetchedAt: number }
  | undefined;

export const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fetchSensorData = (date?: Date): Promise<SensorRecord[]> => {
  const dateString = date ? toDateString(date) : "";
  const cached = cache.get(dateString);

  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached.request;
  }

  const url = dateString
    ? `/api/sensors?date=${dateString}`
    : "/api/sensors";

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as SensorRecord[];
    })
    .catch((error) => {
      cache.delete(dateString);
      throw error;
    });

  cache.set(dateString, { request, fetchedAt: Date.now() });

  return request;
};

// 地図用：センサーごとの最新位置だけを取得する
export const fetchLatestSensorPositions =
  (): Promise<LatestSensorPositions> => {
    if (
      latestPositionsCache &&
      Date.now() - latestPositionsCache.fetchedAt < CACHE_MS
    ) {
      return latestPositionsCache.request;
    }

    const request = fetch("/api/sensors?positionsOnly=1")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as LatestSensorPositions;
      })
      .catch((error) => {
        latestPositionsCache = undefined;
        throw error;
      });

    latestPositionsCache = {
      request,
      fetchedAt: Date.now(),
    };

    return request;
  };