import { useState, useEffect, useMemo } from "react";
import { fetchSensorData, makeGraphPoints, type SensorRecord } from "@/services/sensorData";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import "./GraphChart.css";

// 横軸のその点にラベルを表示するか（年モードは全部表示）
const isLabelShown = (_graphMode: string, _value: string) => true;
    //graphMode !== "月" || LABEL_DAYS.includes(Number(value.slice(8, 10)));

// 横軸ラベル（2段）を作る関数を返す
//   月モード：上段に月、下段に日
//   年モード：上段に年、下段に月
// 上段は「月（年）の最初」と「表示範囲で一番左のラベル」にだけ出す。
// スクロールしても左端に必ず月（年）が表示される。
const makeXAxisFormatter = (xData: string[], graphMode: string, startIndex: number) => {
    if (graphMode === "日") return (value: string) => value; // "00:30" など

    // 表示範囲で一番左に表示されるラベル（ECharts が渡す index はデータの番号ではないので、日付文字列で比べる）
    const firstShown = xData.find((value, i) => i >= startIndex && isLabelShown(graphMode, value));

    return (value: string) => {
        const month = Number(value.slice(5, 7));
        if (graphMode === "月") {
            const day = Number(value.slice(8, 10));
            const top = day === 1 || value === firstShown ? `${month}月` : " ";
            return `${top}\n${day}`;
        }
        const top = month === 1 || value === firstShown ? `${value.slice(0, 4)}年` : " ";
        return `${top}\n${month}`;
    };
};

const NO_RECORDS: SensorRecord[] = [];
const getDataKind = (graphMode: string) => (graphMode === "日" ? "today" : "all");


type Props = {
    graphType: string;
    graphMode: string;
    unit: string;
    targetValue: number | null;
};

export default function GraphChart({
    graphType,
    graphMode,
    unit,
    targetValue,
}: Props) {
    const [fetched, setFetched] = useState<{ kind: string; records: SensorRecord[] }>({
    kind: "",
    records: NO_RECORDS,
});
    const [currentDate] = useState(() => new Date());

    useEffect(() => {
        let ignore = false;
        // 過去に遡れるよう、日モード以外は常に全期間を取得
        const request = graphMode === "日" ? fetchSensorData(currentDate) : fetchSensorData();
        request
            .then((data) => { if (!ignore) setFetched({ kind: getDataKind(graphMode), records: data }); })
            //.then((data) => { if (!ignore) setRecords(data); })
            .catch((error) => console.error("グラフ用データの取得に失敗しました:", error));
        return () => { ignore = true; };
    }, [graphMode, currentDate]);

    const records = fetched.kind === getDataKind(graphMode) ? fetched.records : NO_RECORDS;
    const isLoading = fetched.kind !== getDataKind(graphMode);

    const graphData = useMemo(() => {
        return makeGraphPoints(records, graphType, graphMode, currentDate);
    }, [records, graphType, graphMode, currentDate]);

    const xData = useMemo(() => graphData.map((d) => d.label), [graphData]);

    // スマホなど画面が狭いか（日モードで30分ごとのラベルを全部出しても重ならないよう、表示時間を短くする）
    const isNarrow = window.innerWidth < 600;

    // 1画面に表示する点の数
    //   日モード：PC 24点（11時間半）、スマホ 6点（3時間。例：12:30〜15:30）
    //   月モード：31日、年モード：12か月（「今月だけ」にすると月初は1〜2点しか出ないため）
    const visibleCount = graphMode === "日" ? (isNarrow ? 6 : 24) : graphMode === "月" ? (isNarrow ? 7 : 31) : 12;

    // 最初に表示する範囲：日モードは最新のデータがある時刻まで、月・年モードは最後の点まで
    // それより前は左へスクロールして見る
    const lastDataIndex = graphData.findLastIndex((d) => d.value !== null);
    const initialEndIndex =
        graphMode === "日" ? Math.max(lastDataIndex, visibleCount - 1) : xData.length - 1;
    const initialStartIndex = Math.max(0, initialEndIndex - (visibleCount - 1));

    //dataZoomの初期表示フォーカス範囲を計算
    const zoomRange = useMemo(() => {
        if (xData.length === 0) return { start: 0, end: 100 };

        // 日付文字列でズーム範囲を指定する（後述の dataZoom で startValue / endValue として使う）
        return {
            startValue: xData[initialStartIndex],
            endValue: xData[initialEndIndex],
        };
    }, [xData, initialStartIndex, initialEndIndex]);

    // スクロールしたら、表示範囲の左端に合わせて横軸ラベルの上段（月・年）を付け直す
    // （React の state にすると再描画でスクロール位置が戻るため、ECharts の表示だけを直接書き換える）
    const onEvents = useMemo(() => ({
        dataZoom: (_: unknown, chart: ECharts) => {
            if (graphMode === "日") return;
            const [dataZoom] = chart.getOption().dataZoom as { startValue: number }[];
            chart.setOption({
                xAxis: { axisLabel: { formatter: makeXAxisFormatter(xData, graphMode, dataZoom.startValue) } },
            });
        },
    }), [xData, graphMode]);

    const xUnit = graphMode === "日" ? "時間" : graphMode === "月" ? "日" : "月";

    // 横軸ラベルの間引き方
    //   日モード：30分ごとに全部表示する（自動にすると、スマホでは2時間ごとに間引かれてしまう）
    //   月モード：1日・5日・10日・15日・20日・25日だけ表示する
    //   年モード：1画面に表示されるのは最大12か月なので全部表示する
    const labelInterval =
        graphMode === "日" ? 0 : (_: number, value: string) => isLabelShown(graphMode, value);

    // スマホの日モードは、ラベルを斜めにして重ならないようにする
    const rotateLabel = graphMode === "日" && isNarrow;

    const option = {
        grid: {
            left: 45,
            right: 40,
            top: 40,
            // 月・年モード（ラベル2段）とスマホの日モード（ラベル斜め）は、ラベルの分だけ広げる
            bottom: graphMode === "日" && !rotateLabel ? 30 : 45,
        },
        xAxis: {
            type: "category",
            data: xData,
            name: `[${xUnit}]`,
            nameLocation: "end",
            nameGap: 10,
            axisLabel: {
                // 2段ラベル（上段：月・年、下段：日・月）。スクロールすると onEvents で付け直す
                formatter: makeXAxisFormatter(xData, graphMode, initialStartIndex),
                interval: labelInterval,
                rotate: rotateLabel ? 0 : 0,
            }
        },
        yAxis: {
            type: "value",
            name: `[${unit}]`,
            nameLocation: "end",
            nameTextStyle: { align: "left" },
        },
        series: [
            {
                type: "line",
                smooth: true,
                data: graphData.map((d) => d.value),
                symbol: "circle",
                symbolSize: 12,
                color: "#4A90E2",
                emphasis: {
                    label: {
                        show: true,
                        position: "top",
                        distance: 10,
                        formatter: (params: any) => `${params.value}${unit}`,
                        fontSize: 14,
                        fontWeight: "bold",
                        color: "#333",
                    },
                },
                markLine: targetValue === null ? undefined : {
                    symbol: ["none", "none"],
                    label: {
                        position: "end",
                        color: "#2ecc71",
                        fontWeight: "bold",
                        formatter: `${targetValue}`,
                    },
                    lineStyle: {
                        color: "#2ecc71",
                        type: "solid",
                        width: 2,
                    },
                    data: [{ yAxis: targetValue }],
                }
            }
        ],
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                // ★ 変更: パーセンテージ(start/end)ではなく、算出した日付文字列(startValue/endValue)で初期範囲を固定
                ...zoomRange,
                zoomLock: true,
                moveOnMouseMove: true,
                moveOnMouseWheel: false,
            },
        ],
    };

return (
    <div className="graph-chart">
        {isLoading ? null : (
            <ReactECharts
                option={option}
                notMerge={true}
                onEvents={onEvents}
                style={{ width: "100%", height: "100%" }}
            />
        )}
    </div>
);

}
