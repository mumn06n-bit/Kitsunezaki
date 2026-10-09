import Papa from "papaparse";

// GPS情報
type SensorPosition = {
  latitude: number | null;
  longitude: number | null;
  latitudeDMS: string | null;
  longitudeDMS: string | null;
};

// センサデータ
type SensorRecord = {
  datetime: string;

  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;

  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;

  // センサごとの位置
  positions: {
    salinity: SensorPosition;
    DO01: SensorPosition;
    DO02: SensorPosition;
    DO03: SensorPosition;
  };
};

type ValueKey = Exclude<
  keyof SensorRecord,
  "datetime" | "positions"
>;

// API設定
const SOURCES: {
  name: string;
  url: string | undefined;
  columns: Partial<Record<ValueKey, number>>;
  positionKey:
    | "salinity"
    | "DO01"
    | "DO02"
    | "DO03";
}[] = [
  {
    name: "salinity",
    url: process.env.SALINITY_API_URL,

    columns: {
      outsideTemp: 3,
      waterTemp: 4,
      salinity: 6,
    },

    positionKey: "salinity",
  },

  {
    name: "do1",
    url: process.env.DO1_API_URL,

    columns: {
      oxygen1: 6,
    },

    positionKey: "DO01",
  },

  {
    name: "do2",
    url: process.env.DO2_API_URL,

    columns: {
      oxygen2: 6,
    },

    positionKey: "DO02",
  },

  {
    name: "do3",
    url: process.env.DO3_API_URL,

    columns: {
      oxygen3: 6,
    },

    positionKey: "DO03",
  },
];

// GPS計算
function convertGPS(
  a: number,
  b: number,
  c: number
) {
  const value = Math.floor(a * 100);

  // 256で割った商 → 緯度の度
  const latitudeDegree =
    Math.floor(value / 256);

  // 256で割った余り → 経度の度
  const longitudeDegree =
    value % 256;

  // 緯度の分
  const latitudeMinute = b / 10;

  // 経度の分
  const longitudeMinute = c / 10;

  // 10進数
  const latitudeDecimal =
    latitudeDegree +
    latitudeMinute / 60;

  const longitudeDecimal =
    longitudeDegree +
    longitudeMinute / 60;

  // 60進数
  const latitudeDMS =
    `${latitudeDegree}°${latitudeMinute.toFixed(3)}'N`;

  const longitudeDMS =
    `${longitudeDegree}°${longitudeMinute.toFixed(3)}'E`;

  return {
    latitudeDecimal,
    longitudeDecimal,
    latitudeDMS,
    longitudeDMS,
  };
}

// 空のGPSデータ
const emptyPosition =
  (): SensorPosition => ({
    latitude: null,
    longitude: null,
    latitudeDMS: null,
    longitudeDMS: null,
  });

// UTC → 日本時間
const toJstKey = (
  value: string
) => {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const jst = new Date(
    date.getTime() +
      9 * 60 * 60 * 1000
  );

  return (
    jst
      .toISOString()
      .slice(0, 16) +
    ":00"
  );
};

// 数値変換
const toNumber = (
  value: string | undefined
) => {
  if (
    value === undefined ||
    value.trim() === ""
  ) {
    return null;
  }

  const num = Number(value);

  return Number.isFinite(num)
    ? num
    : null;
};

// CSV取得
const fetchCsvRows = async (
  url: string
) => {
  const apiResponse =
    await fetch(url, {
      headers: {
        "User-Agent":
          "api_test/1.0",
      },
    });

  if (!apiResponse.ok) {
    throw new Error(
      `upstream status ${apiResponse.status}`
    );
  }

  const parsed =
    Papa.parse<string[]>(
      await apiResponse.text(),
      {
        header: false,
        skipEmptyLines: true,
      }
    );

  return parsed.data;
};

// Vercel用の型
type ApiRequest = {
  query?: Record<
    string,
    string | string[] | undefined
  >;
};

type ApiResponse = {
  status(
    code: number
  ): ApiResponse;

  json(
    body: unknown
  ): ApiResponse;

  setHeader(
    name: string,
    value: string
  ): void;
};

// API
export default async function handler(
  request: ApiRequest,
  response: ApiResponse
) {
  const dateParam =
    request.query?.date;

  const date =
    typeof dateParam ===
    "string"
      ? dateParam
      : undefined;

  // 全API取得
  const results =
    await Promise.allSettled(
      SOURCES.map(
        (source) => {
          if (!source.url) {
            return Promise.reject(
              new Error(
                `${source.name} のAPI URLが設定されていません。`
              )
            );
          }

          return fetchCsvRows(
            source.url
          );
        }
      )
    );

  // 日時ごとに統合
  const records =
    new Map<
      string,
      SensorRecord
    >();

  results.forEach(
    (result, i) => {
      const source =
        SOURCES[i];

      if (
        result.status ===
        "rejected"
      ) {
        console.error(
          `${source.name} の取得に失敗しました:`,
          result.reason
        );

        return;
      }

      for (
        const row of result.value
      ) {
        if (!row[1]) {
          continue;
        }

        const key =
          toJstKey(row[1]);

        if (!key) {
          continue;
        }

        if (
          date &&
          !key.startsWith(date)
        ) {
          continue;
        }

        // レコード作成
        let record =
          records.get(key);

        if (!record) {
          record = {
            datetime: key,

            waterTemp: null,
            outsideTemp: null,
            salinity: null,

            oxygen1: null,
            oxygen2: null,
            oxygen3: null,

            positions: {
              salinity:
                emptyPosition(),

              DO01:
                emptyPosition(),

              DO02:
                emptyPosition(),

              DO03:
                emptyPosition(),
            },
          };

          records.set(
            key,
            record
          );
        }

        // 水温・塩分・DO
        for (
          const [
            field,
            column,
          ] of Object.entries(
            source.columns
          )
        ) {
          record[
            field as ValueKey
          ] = toNumber(
            row[
              column as number
            ]
          );
        }

        const a =
          toNumber(row[7]);

        const b =
          toNumber(row[8]);

        const c =
          toNumber(row[9]);

        if (
          a !== null &&
          b !== null &&
          c !== null
        ) {
          const gps =
            convertGPS(
              a,
              b,
              c
            );

          record.positions[
            source.positionKey
          ] = {
            latitude:
              gps.latitudeDecimal,

            longitude:
              gps.longitudeDecimal,

            latitudeDMS:
              gps.latitudeDMS,

            longitudeDMS:
              gps.longitudeDMS,
          };
        }
      }
    }
  );

  // 全API失敗
  if (
    results.every(
      (result) =>
        result.status ===
        "rejected"
    )
  ) {
    return response
      .status(502)
      .json({
        error:
          "元APIからのデータ取得に失敗しました。",
      });
  }

  // 日時順
  const body = [
    ...records.values(),
  ].sort(
    (a, b) =>
      a.datetime.localeCompare(
        b.datetime
      )
  );

  // レスポンス
  response.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET"
  );

  response.setHeader(
    "Cache-Control",
    "s-maxage=60, stale-while-revalidate=300"
  );

  return response
    .status(200)
    .json(body);
}