import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  getSensorUnit,
  type CompareSettings,
} from "@/pages/ComparePage/compareData";
import "./CompareChart.css";

type SensorData = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
};

export default function CompareChart({
  settings,
}: {
  settings: CompareSettings;
}) {
  const { sensorType, graphPeriod, periods } = settings;
  const doSensor = localStorage.getItem("doSensor") ?? "DO01";
  const unit = getSensorUnit(sensorType);

  const [sensorData, setSensorData] = useState<
  Record<number, SensorData[]>
>({});
const [isLoading, setIsLoading] = useState(true);

 // 日付指定のとき、選択された各日の実データを取得
useEffect(() => {
  if (periods.length === 0) {
    setSensorData({});
    setIsLoading(false);
    return;
  }
  setIsLoading(true);

  const fetchData = async () => {
    const results: Record<number, SensorData[]> = {};

    try {
      if (graphPeriod === "day") {
        await Promise.all(
          periods.map(async (period) => {
            const date = `${period.year}-${String(period.month).padStart(
              2,
              "0"
            )}-${String(period.day).padStart(2, "0")}`;

            const response = await fetch(`/api/sensors?date=${date}`);

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data: SensorData[] = await response.json();

            results[period.id] = data;

            console.log(`${date} の比較データ:`, data);
          })
        );
      }

      if (graphPeriod === "month") {
  await Promise.all(
    periods.map(async (period) => {
      const month = `${period.year}-${String(period.month).padStart(
        2,
        "0"
      )}`;

      const response = await fetch(`/api/sensors?date=${month}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SensorData[] = await response.json();

      results[period.id] = data;

      console.log(
        `${period.year}/${period.month} の比較データ:`,
        data
      );
    })
  );
}

if (graphPeriod === "year") {
  await Promise.all(
    periods.map(async (period) => {
      const year = String(period.year);

      const response = await fetch(`/api/sensors?date=${year}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SensorData[] = await response.json();

      results[period.id] = data;

      console.log(
        `${period.year}年の比較データ:`,
        data
      );
    })
  );
}

      setSensorData(results);
    } catch (error) {
      console.error("センサーデータ取得エラー:", error);
      setSensorData({});
    }finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [graphPeriod, periods]);

  let xData: string[] = [];
  let series: any[] = [];

  if (graphPeriod === "month") {
  // 月選択
  xData = Array.from({ length: 31 }, (_, i) => `${i + 1}`);

  // センサーの種類とAPIの項目を対応させる
  const sensorField =
    sensorType === "air"
      ? "outsideTemp"
      : sensorType === "water"
        ? "waterTemp"
        : sensorType === "salt"
          ? "salinity"
          : doSensor === "DO02"
          ? "oxygen2"
          : doSensor === "DO03"
            ? "oxygen3"
          : "oxygen1";

  series = periods.map((period) => {
    const periodData = sensorData[period.id] ?? [];

    return {
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      connectNulls: false,
      color: period.color,
      itemStyle: { color: period.color },

      data: xData.map((day) => {
        const targetDay = String(day).padStart(2, "0");

        const records = periodData.filter((item) =>
          item.datetime.includes(`-${targetDay}T`)
        );

        const values = records
          .map((record) => record[sensorField])
          .filter(
            (value): value is number => value !== null
          );

        if (values.length === 0) {
          return null;
        }

        // その日の平均値
        return (
          values.reduce((sum, value) => sum + value, 0) /
          values.length
        );
      }),
    };
  });
} else if (graphPeriod === "year") {
  // 年選択
  // 1月～12月
  xData = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

  // センサーの種類とAPIの項目を対応させる
  const sensorField =
    sensorType === "air"
      ? "outsideTemp"
      : sensorType === "water"
        ? "waterTemp"
        : sensorType === "salt"
          ? "salinity"
          : doSensor === "DO02"
          ? "oxygen2"
          : doSensor === "DO03"
            ? "oxygen3"
          : "oxygen1";

  series = periods.map((period) => {
    const periodData = sensorData[period.id] ?? [];

    return {
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      connectNulls: false,
      color: period.color,
      itemStyle: { color: period.color },

      data: xData.map((month) => {
        const targetMonth = String(month).padStart(2, "0");

        // その月のデータだけ取得
        const records = periodData.filter((item) =>
          item.datetime.includes(`-${targetMonth}-`)
        );

        // センサーの値だけ取り出す
        const values = records
          .map((record) => record[sensorField])
          .filter(
            (value): value is number => value !== null
          );

        // データがなければ表示しない
        if (values.length === 0) {
          return null;
        }

        // その月の平均値
        return (
          values.reduce((sum, value) => sum + value, 0) /
          values.length
        );
      }),
    };
  });
  } else {
    // 日選択：00:00～23:30の48点
    xData = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? "00" : "30";

      return `${String(hour).padStart(2, "0")}:${minute}`;
    });

    // センサーの種類とAPIの項目を対応させる
    const sensorField =
      sensorType === "air"
        ? "outsideTemp"
        : sensorType === "water"
          ? "waterTemp"
          : sensorType === "salt"
            ? "salinity"
            : doSensor === "DO02"
          ? "oxygen2"
          : doSensor === "DO03"
            ? "oxygen3"
            : "oxygen1";

    series = periods.map((period) => {
  const periodData = sensorData[period.id] ?? [];

  return {
    type: "line",
    smooth: true,
    symbol: "circle",
    symbolSize: 5,
    connectNulls: false,
    color: period.color,
    itemStyle: { color: period.color },

    data: xData.map((time) => {
      const record = periodData.find((item) =>
        item.datetime.includes(`T${time}:`)
      );

      return record
        ? record[sensorField]
        : null;
    }),
  };
});
  }

  const xUnit =
    graphPeriod === "month"
      ? "日"
      : graphPeriod === "year"
        ? "月"
        : "時間";

  const option = {
    grid: {
      left: 35,
      right: 20,
      top: 35,
      bottom: 70,
    },

   xAxis: {
  type: "category",
  data: xData,
  name: `[${xUnit}]`,
  nameLocation: "end",
  nameGap: 15,

  axisLabel: {
    interval: window.innerWidth <= 768 ? 0 : "auto",
  },
},

    yAxis: {
      type: "value",
      name: `[${unit}]`,
      nameLocation: "end",
      nameGap: 15,
    },

    series,
  };

  return (
  <div className="compare-chart-scroll">
    <div className="compare-chart">
       {isLoading ? null : (
      <ReactECharts
        option={option}
        notMerge={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
       )}
    </div>
  </div>
);
}