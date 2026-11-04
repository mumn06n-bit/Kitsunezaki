
import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
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

// センサーの数値項目を表す型
type SensorField = Exclude<keyof SensorData, "datetime">;

// 溶存酸素の有効範囲を判定する
const isValidOxygen = (value: number | null): value is number =>
    value !== null && value >= 0 && value <= 15;

// センサー値の平均を計算する
const getAverage = (
    records: SensorData[],
    sensorField: SensorField
): number | null => {
    const values = records
        .map((record) => record[sensorField])
        .filter((value): value is number =>
            sensorField.startsWith("oxygen")
                ? isValidOxygen(value)
                : typeof value === "number"
        );

    if (values.length === 0) {
        return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

// 1つのセンサー値を取得する
// 溶存酸素の場合は0～15の範囲外を除外する
const getSensorValue = (
    record: SensorData,
    sensorField: SensorField
): number | null => {
    const value = record[sensorField];

    if (sensorField.startsWith("oxygen")) {
        return isValidOxygen(value) ? value : null;
    }

    return value;
};

const createLineSettings = (
    period: CompareSettings["periods"][number],
    symbolSize: number
) => ({
    type: "line" as const,
    smooth: true,
    symbol: "circle",
    symbolSize,
    connectNulls: false,
    color: period.color,
    itemStyle: { color: period.color },
});

// 指定した時刻のセンサーデータを取得する
const getRecordByTime = (
    records: SensorData[],
    time: string
) =>
    records.find((item) =>
        item.datetime.includes(`T${time}:`)
    );

// 指定した日または月に一致するデータを抽出する
const getRecordsByDate = (
    records: SensorData[],
    datePart: string,
    mode: "day" | "month"
) =>
    records.filter((item) =>
        mode === "day"
            ? item.datetime.includes(`-${datePart}T`)
            : item.datetime.includes(`-${datePart}-`)
    );

export default function CompareChart({
    settings,
}: {
    settings: CompareSettings;
}) {
    const { sensorType, graphPeriod, periods } = settings;
    const unit = getSensorUnit(sensorType);

    const [sensorData, setSensorData] = useState<
        Record<number, SensorData[]>
    >({});
    const [isLoading, setIsLoading] = useState(true);

    // センサーごとのデータフィールドを取得
    const getSensorField = (
        period: CompareSettings["periods"][number]
    ): SensorField => {
        switch (sensorType) {
            case "air":
                return "outsideTemp";
            case "water":
                return "waterTemp";
            case "salt":
                return "salinity";
            case "oxygen":
                return period.oxygenSensor ?? "oxygen1";
        }
    };

    // 選択した期間のデータを取得
    useEffect(() => {
        let cancelled = false;

        const getDateQuery = (
            period: CompareSettings["periods"][number]
        ) => {
            const year = period.year;
            const month = String(period.month).padStart(2, "0");
            const day = String(period.day).padStart(2, "0");

            if (graphPeriod === "day") {
                return `${year}-${month}-${day}`;
            } else if (graphPeriod === "month") {
                return `${year}-${month}`;
            } else {
                return String(year);
            }
        };

        if (periods.length === 0) {
            setSensorData({});
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const fetchData = async () => {
            const results: Record<number, SensorData[]> = {};

            try {
                await Promise.all(
                    periods.map(async (period) => {
                        const date = getDateQuery(period);
                        const response = await fetch(`/api/sensors?date=${date}`);

                        if (!response.ok) {
                            throw new Error(`API error: ${response.status}`);
                        }

                        const data: SensorData[] = await response.json();
                        results[period.id] = data;
                    })
                );

                if (!cancelled) {
                    setSensorData(results);
                }
            } catch (error) {
                console.error("センサーデータ取得エラー:", error);

                if (!cancelled) {
                    setSensorData({});
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [graphPeriod, periods]);

    // 横軸ラベル
    const labels = useMemo(
        () =>
            graphPeriod === "month"
                ? Array.from({ length: 31 }, (_, i) => `${i + 1}`)
                : graphPeriod === "year"
                    ? Array.from({ length: 12 }, (_, i) => `${i + 1}`)
                    : Array.from({ length: 48 }, (_, i) => {
                        const hour = Math.floor(i / 2);
                        const minute = i % 2 === 0 ? "00" : "30";
                        return `${String(hour).padStart(2, "0")}:${minute}`;
                    }),
        [graphPeriod]
    );

    // グラフのデータを作成
    const series: NonNullable<EChartsOption["series"]> = useMemo(() => {
        if (graphPeriod === "month") {
            return periods.map((period) => {
                const periodData = sensorData[period.id] ?? [];
                const sensorField = getSensorField(period);

                return {
                    ...createLineSettings(period, 8),
                    data: labels.map((day) => {
                        const targetDay = String(day).padStart(2, "0");
                        const records = getRecordsByDate(
                            periodData,
                            targetDay,
                            "day"
                        );

                        return getAverage(records, sensorField);
                    }),
                };
            });
        }

        if (graphPeriod === "year") {
            return periods.map((period) => {
                const periodData = sensorData[period.id] ?? [];
                const sensorField = getSensorField(period);

                return {
                    ...createLineSettings(period, 8),
                    data: labels.map((month) => {
                        const targetMonth = String(month).padStart(2, "0");
                        const records = getRecordsByDate(
                            periodData,
                            targetMonth,
                            "month"
                        );

                        return getAverage(records, sensorField);
                    }),
                };
            });
        }

        return periods.map((period) => {
            const periodData = sensorData[period.id] ?? [];
            const sensorField = getSensorField(period);

            return {
                ...createLineSettings(period, 5),
                data: labels.map((time) => {
                    const record = getRecordByTime(periodData, time);

                    return record
                        ? getSensorValue(record, sensorField)
                        : null;
                }),
            };
        });
    }, [graphPeriod, periods, sensorData, labels, sensorType]);

    const xUnit =
        graphPeriod === "month"
            ? "日"
            : graphPeriod === "year"
                ? "月"
                : "時間";

    // スマホでは表示範囲を狭くする
    const isNarrow = window.innerWidth <= 768;

    // 日は6点、月は10点、年は6点ずつ表示
    const visibleCount =
        graphPeriod === "day"
            ? 6
            : graphPeriod === "month"
                ? 10
                : graphPeriod === "year"
                    ? 6
                    : labels.length;

    const initialEndIndex = Math.min(
        visibleCount - 1,
        labels.length - 1
    );

    const initialStartIndex = 0;

    const dataZoom = [
        {
            type: "inside" as const,
            xAxisIndex: 0,
            startValue: initialStartIndex,
            endValue: initialEndIndex,
            zoomLock: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
        },
    ];

    // 全期間の溶存酸素データを取得
    const oxygenValues =
        sensorType === "oxygen"
            ? (series as Array<{ data: (number | null)[] }>).flatMap(
                (item) =>
                    item.data.filter(isValidOxygen)
            )
            : [];

    // 溶存酸素の縦軸を自動計算
    const oxygenMin = oxygenValues.length > 0
        ? Math.max(0, Math.min(...oxygenValues) - 1)
        : 0;

    const oxygenMax = oxygenValues.length > 0
        ? Math.min(15, Math.max(...oxygenValues) + 1)
        : 15;

    const option: EChartsOption = {
        grid: {
            left: 45,
            right: 40,
            top: 35,
            bottom: 55,
        },

        xAxis: {
            type: "category",
            data: labels,
            name: `[${xUnit}]`,
            nameLocation: "end",
            nameGap: 15,
            axisLabel: {
                interval: isNarrow ? 0 : "auto",
            },
        },

        yAxis: {
            type: "value",

            min: sensorType === "salt"
                ? 25
                : sensorType === "oxygen"
                    ? oxygenMin
                    : undefined,

            max: sensorType === "salt"
                ? 35
                : sensorType === "oxygen"
                    ? oxygenMax
                    : undefined,

            interval: sensorType === "salt"
                ? 1
                : undefined,

            splitNumber: sensorType === "oxygen"
                ? 6
                : undefined,

            axisLabel: {
                formatter: (value: string | number) =>
                    sensorType === "oxygen"
                        ? Number(value).toFixed(1)
                        : String(value),
            },

            name: `[${unit}]`,
            nameLocation: "end",
            nameGap: 15,
        },

        dataZoom,

        series,
    };

    return (
        <div className="compare-chart-scroll">
            <div className="compare-chart">
                {isLoading ? null : (
                    <ReactECharts
                        key={graphPeriod}
                        option={option}
                        notMerge
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
