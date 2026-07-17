import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompareSetting.css";

import PageLayout from "@/components/PageLayout";

export default function CompareSettingPage() {

  const navigate = useNavigate();
  const [compareSettings, setCompareSettings] = useState<any>(null);

  const [periods, setPeriods] = useState([
    { id: 1, color: "#ff6b6b", date: "2026-05-01" },
    { id: 2, color: "#6ba8ff", date: "2026-06-01" },
  ]);

  // 期間の色
  const colors = [
    "#ff6b6b",
    "#6ba8ff",
    "#63d471",
    "#f7c948",
    "#b56eff",
  ];

  // 期間の追加
  const addPeriod = () => {
    setPeriods((prevPeriods) => {
      if (prevPeriods.length >= 5) return prevPeriods;

      const usedColors = prevPeriods.map((period) => period.color);

      const newColor = colors.find(
        (color) => !usedColors.includes(color)
      );

      if (!newColor) return prevPeriods;

      return [
        ...prevPeriods,
        {
          id: Date.now(),
          color: newColor,
          date: "2026-07-01",
        },
      ];
    });
  };

  // 期間の削除
  const deletePeriod = (id: number) => {
    setPeriods((prevPeriods) =>
      prevPeriods.filter((period) => period.id !== id)
    );
  };

  // 期間の設定
  const updatePeriodDate = (id: number, date: string) => {
    setPeriods((prevPeriods) =>
      prevPeriods.map((period) =>
        period.id === id
          ? { ...period, date }
          : period
      )
    );
  };

  // ダミーデータ
  {
    compareSettings && (
      <div className="debug-area">
        <p>相関モード：{compareSettings.correlationMode ? "ON" : "OFF"}</p>
        <p>種類：{compareSettings.sensorType}</p>
        <p>期間：{compareSettings.graphPeriod}</p>
        <p>比較数：{compareSettings.periods.length}</p>
      </div>
    )
  }

  // 設定の保存
  const saveSettings = () => {
    localStorage.setItem(
      "comparePeriods",
      JSON.stringify(periods)
    );

    navigate("/compare");
  };

  useEffect(() => {
    const saved = localStorage.getItem("compareSettings");

    if (saved) {
      setCompareSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <PageLayout
      title="比較設定"
      showBackButton={true}
    >

      {/* 比較設定表示エリア */}
      <section className="compare-setting-area">
        {/* 相関モード */}
        <div className="setting-row">
          <label>相関モード</label>

          <label className="switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>

        {/* 種類 */}
        <div className="setting-section">
          <p className="section-title">種類</p>

          <div className="radio-grid">
            <label>
              <input type="radio" name="sensor" value="air" />
              気温
            </label>

            <label>
              <input type="radio" name="sensor" value="water" defaultChecked />
              水温
            </label>

            <label>
              <input type="radio" name="sensor" value="salt" />
              塩分濃度
            </label>

            <label>
              <input type="radio" name="sensor" value="oxygen" />
              溶存酸素
            </label>
          </div>
        </div>

        <hr className="setting-divider" />

        {/* グラフ期間 */}
        <div className="setting-section">
          <p className="section-title">グラフ期間</p>

          <div className="period-radio">
            <label>
              <input type="radio" name="period" value="day" />
              日
            </label>

            <label>
              <input type="radio" name="period" value="month" defaultChecked />
              月
            </label>

            <label>
              <input type="radio" name="period" value="year" />
              年
            </label>
          </div>
        </div>

        <hr className="setting-divider" />

        {/* 期間 */}
        <div className="setting-section">

          <p className="section-title">期間</p>

          {periods.map((period) => (
            <div className="period-card" key={period.id}>

              <div
                className="period-color"
                style={{ backgroundColor: period.color }}
              />

              <input
                type="date"
                value={period.date}
                onChange={(e) => updatePeriodDate(period.id, e.target.value)}
              />

              <button
                className="delete-button"
                onClick={() => deletePeriod(period.id)}
              >
                ×
              </button>

            </div>
          ))}

          {periods.length < 5 && (
            <button
              className="add-period-button"
              onClick={addPeriod}
            >
              ＋ 期間を追加
            </button>
          )}

        </div>

        <div className="ok-button-area">
          <button
            className="ok-button"
            onClick={saveSettings}
          >
            OK
          </button>
        </div>

      </section>

    </PageLayout>
  );
}