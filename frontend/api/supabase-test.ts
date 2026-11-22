
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
  send(body: string): ApiResponse;
  setHeader(name: string, value: string): void;
};

const PAGE_SIZE = 1000;

// UTCの日時を日本時間（JST）に変換
const formatJST = (datetime: string | null) => {
  if (!datetime) return "";

  const date = new Date(datetime);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
  });

  const month = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
  });

  const day = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
  });

  const hour = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    hour12: false,
  });

  const minute = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    minute: "2-digit",
  });

  const second = date.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    second: "2-digit",
  });

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// CSVの列名
const CSV_HEADERS = [
  "センサーID",
  "日時",
  "水温",
  "外気温",
  "塩分濃度",
  "溶存酸素割合",
  "溶存酸素濃度",
  "GPS情報1",
  "GPS情報2",
  "GPS情報3",
];

export default async function handler(
  request: ApiRequest,
  response: ApiResponse
) {
  response.setHeader("Cache-Control", "no-store");

  // GET以外は受け付けない
  if (request.method !== "GET") {
    return response.status(405).json({
      error: "GETリクエストのみ対応しています。",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return response.status(500).json({
      error: "Supabaseの接続情報が設定されていません。",
    });
  }

  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 全データを1000件ずつ取得
    const allRecords: {
      sensor_id: string | null;
      datetime: string | null;
      water_temp: number | null;
      outside_temp: number | null;
      salinity: number | null;
      do_percent: number | null;
      do_mgl: number | null;
      pos1: number | null;
      pos2: number | null;
      pos3: number | null;
    }[] = [];

    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("sensor_readings")
        .select(
          "sensor_id, datetime, water_temp, outside_temp, salinity, do_percent, do_mgl, pos1, pos2, pos3"
        )
        .order("datetime", { ascending: true })
        .order("sensor_id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("Supabase取得エラー:", error);

        return response.status(500).json({
          error: "Supabaseからデータを取得できませんでした。",
        });
      }

      if (!data || data.length === 0) break;

      allRecords.push(...data);

      // 取得件数が1000件未満なら終了
      if (data.length < PAGE_SIZE) break;

      from += PAGE_SIZE;
    }

    // CSV用の配列に変換
    const csvRows = allRecords.map((record) => [
      record.sensor_id ?? "",
      record.datetime ? formatJST(record.datetime) : "",
      record.water_temp ?? "",
      record.outside_temp ?? "",
      record.salinity ?? "",
      record.do_percent ?? "",
      record.do_mgl ?? "",
      record.pos1 ?? "",
      record.pos2 ?? "",
      record.pos3 ?? "",
    ]);

    // CSVを作成
    const csv = Papa.unparse({
      fields: CSV_HEADERS,
      data: csvRows,
    });

    // Excelなどでの文字化けを防ぐためUTF-8 BOMを付ける
    const bom = "\uFEFF";

    response.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="sensor_readings.csv"'
    );

    return response.status(200).send(bom + csv);
  } catch (error) {
    console.error("CSV作成エラー:", error);

    return response.status(500).json({
      error: "CSVファイルの作成に失敗しました。",
    });
  }
}
