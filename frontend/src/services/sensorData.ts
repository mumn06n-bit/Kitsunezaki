
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

// ---- グラフ画面で共通に使う部品 ----

// 数値の項目名（"datetime" 以外）
type ValueField = Exclude<keyof SensorRecord, "datetime" | "positions">;

// 設定画面のDOセンサ → 統合データのどの項目か
export const DO_FIELD: Record<string, ValueField> = {
  DO01: "oxygen1",
  DO02: "oxygen2",
  DO03: "oxygen3",
};

// 画面の種類名 → 統合データの項目名
export const getSensorField = (type: string): ValueField => {
  switch (type) {
    case "気温":
      return "outsideTemp";
    case "水温":
      return "waterTemp";
    case "塩分濃度":
      return "salinity";
    case "溶存酸素(DO01)":
      return "oxygen1";
    case "溶存酸素(DO02)":
      return "oxygen2";
    case "溶存酸素(DO03)":
      return "oxygen3";
    case "溶存酸素":
      return "oxygen1";
    default:
      return DO_FIELD[localStorage.getItem("doSensor") ?? "DO01"] ?? "oxygen1";
  }
};

// GraphPoint
export type GraphPoint = { label: string; value: number | null };

const average = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => v !== null);

  if (nums.length === 0) return null;

  return Number(
    (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
  );
};

export const makeGraphPoints = (
  records: SensorRecord[],
  type: string,
  mode: string,
  baseDate = new Date()
): GraphPoint[] => {
  const field = getSensorField(type);
  const dateString = toDateString(baseDate);

  // 日モード：全期間を30分ごとの時間枠に分ける
  if (mode === "日") {
    const groups = new Map<string, (number | null)[]>();

    for (const r of records) {
      const date = r.datetime.slice(0, 10);
      const timePart = r.datetime.slice(11, 16);

      if (!date || !timePart) continue;

      const [hour, min] = timePart.split(":");
      const roundedMin = Number(min) < 30 ? "00" : "30";

      const key = `${date} ${hour}:${roundedMin}`;
      const values = groups.get(key) ?? [];

      values.push(r[field]);
      groups.set(key, values);
    }

    // データが存在する最古の日付
    const sortedDates = Array.from(groups.keys())
      .map((key) => key.slice(0, 10))
      .sort();

    // データがない場合は今日を開始日とする
    const startDate =
      sortedDates.length > 0
        ? sortedDates[0]
        : dateString;

    // 最新データの日付と今日を比較
    const endDate =
      sortedDates.length > 0 &&
      sortedDates[sortedDates.length - 1] > dateString
        ? sortedDates[sortedDates.length - 1]
        : dateString;

    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);

    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    const labels: string[] = [];

    // 最古の日から今日まで、日付ごとに48個の時間枠を作る
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const date = toDateString(d);

      for (let i = 0; i < 48; i++) {
        const hour = String(Math.floor(i / 2)).padStart(2, "0");
        const min = i % 2 === 0 ? "00" : "30";

        labels.push(`${date} ${hour}:${min}`);
      }
    }

    return labels.map((key) => ({
      label: key,
      value: average(groups.get(key) ?? []),
    }));
  }

  // 月・年モード：全期間のデータを集計
  const groups = new Map<string, (number | null)[]>();

  for (const r of records) {
    const key =
      mode === "月"
        ? r.datetime.slice(0, 10)
        : r.datetime.slice(0, 7);

    if (!key) continue;

    const values = groups.get(key) ?? [];
    values.push(r[field]);
    groups.set(key, values);
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  if (sortedKeys.length === 0) return [];

  const allLabels: string[] = [];

  const startParts = sortedKeys[0].split("-").map(Number);
  const endParts = sortedKeys[sortedKeys.length - 1]
    .split("-")
    .map(Number);

  const start = new Date(
    startParts[0],
    startParts[1] - 1,
    startParts[2] || 1
  );

  const end = new Date(
    endParts[0],
    endParts[1] - 1,
    endParts[2] || 1
  );

  if (mode === "月") {
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      allLabels.push(toDateString(d));
    }
  } else {
    for (
      let d = new Date(start);
      d <= end;
      d.setMonth(d.getMonth() + 1)
    ) {
      allLabels.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }
  }

  return allLabels.map((key) => ({
    label: key,
    value: average(groups.get(key) ?? []),
  }));
};
