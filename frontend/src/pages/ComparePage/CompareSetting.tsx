import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompareSetting.css";
import PageLayout from "@/components/PageLayout";

export default function CompareSettingPage() {

  const navigate = useNavigate();

  // 相関モード
  const [correlationMode, setCorrelationMode] = useState(false);

  // 種類
  const [sensorType, setSensorType] = useState("water");
  const [correlationSensors, setCorrelationSensors] = useState<string[]>([]);

  // グラフ期間
  const [graphPeriod, setGraphPeriod] = useState("month");

  // 比較期間
  const [periods, setPeriods] = useState([
    {
      id: 1,
      color: "#ff6b6b",
      date: "2026-05-01",
    },
    {
      id: 2,
      color: "#6ba8ff",
      date: "2026-06-01",
    },
  ]);

  // 期間の色
  const colors = [
    "#ff6b6b",
    "#6ba8ff",
    "#63d471",
    "#f7c948",
    "#b56eff",
  ];

  // 初回のみ保存データを読み込む
  useEffect(() => {

    const saved = localStorage.getItem("compareSettings");

    if (!saved) return;

    const settings = JSON.parse(saved);

    setCorrelationMode(settings.correlationMode);
    setSensorType(settings.sensorType);
    setCorrelationSensors(settings.correlationSensors
      ?? []);
    setGraphPeriod(settings.graphPeriod);
    setPeriods(settings.periods);

  }, []);

  // 期間追加
  const addPeriod = () => {

    if (periods.length >= 5) return;

    const usedColors = periods.map(period => period.color);

    const newColor = colors.find(
      color => !usedColors.includes(color)
    );

    if (!newColor) return;

    const newPeriod = {
      id: Date.now(),
      color: newColor,
      date: "2026-07-01",
    };

    setPeriods(prev => [...prev, newPeriod]);

  };

  // 期間削除
  const deletePeriod = (id: number) => {

    setPeriods(prev =>
      prev.filter(period => period.id !== id)
    );

  };

  // 日付変更
  const updatePeriodDate = (
    id: number,
    date: string
  ) => {

    setPeriods(prev =>
      prev.map(period =>
        period.id === id
          ? { ...period, date }
          : period
      )
    );

  };

  const toggleCorrelationSensor = (sensor: string) => {

    // 既に選択されている場合
    if (correlationSensors.includes(sensor)) {

      setCorrelationSensors(prev =>
        prev.filter(item => item !== sensor)
      );

      return;
    }

    // 2個以上は追加しない
    if (correlationSensors.length >= 2) return;

    setCorrelationSensors(prev => [...prev, sensor]);

  };

  // 保存
  const saveSettings = () => {

    // 相関モードでの種類不足のエラーメッセージ
    if (correlationMode && correlationSensors.length < 2) {
      alert("種類を2つ選択してください。");
      return;
    }

    // 期間不足のエラーメッセージ
    if (periods.length === 0) {
      alert("期間が設定されていません。");
      return;
    }

    const settings = {

      correlationMode,
      sensorType,
      correlationSensors,
      graphPeriod,
      periods,

    };

    localStorage.setItem(
      "compareSettings",
      JSON.stringify(settings)
    );

    navigate("/compare");

  };

  return (
    <PageLayout
      title="比較設定"
      showBackButton={true}
    >

      <section className="compare-setting-area">

        {/* 相関モード */}
        <div className="setting-row">
          <label>相関モード</label>

          <label className="switch">
            <input
              type="checkbox"
              checked={correlationMode}
              onChange={(e) =>
                setCorrelationMode(e.target.checked)
              }
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* 種類 */}

        {!correlationMode && (
          <div className="setting-section">

            <p className="section-title">種類</p>

            <div className="radio-grid">

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="air"
                  checked={sensorType === "air"}
                  onChange={(e) =>
                    setSensorType(e.target.value)
                  }
                />
                気温
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="water"
                  checked={sensorType === "water"}
                  onChange={(e) =>
                    setSensorType(e.target.value)
                  }
                />
                水温
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="salt"
                  checked={sensorType === "salt"}
                  onChange={(e) =>
                    setSensorType(e.target.value)
                  }
                />
                塩分濃度
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="oxygen"
                  checked={sensorType === "oxygen"}
                  onChange={(e) =>
                    setSensorType(e.target.value)
                  }
                />
                溶存酸素
              </label>

            </div>

            {correlationMode && correlationSensors.length < 2 && (
              <p className="error-message">
                種類が足りません
              </p>
            )}

          </div>
        )}

        {correlationMode && (

          <div className="setting-section">

            <p className="section-title">種類</p>

            <div className="radio-grid">

              {[
                { value: "air", label: "気温" },
                { value: "water", label: "水温" },
                { value: "salt", label: "塩分濃度" },
                { value: "oxygen", label: "溶存酸素" },
              ].map((sensor) => (

                <label key={sensor.value}>

                  <input
                    type="checkbox"
                    checked={correlationSensors.includes(sensor.value)}
                    onChange={() =>
                      toggleCorrelationSensor(sensor.value)
                    }
                    disabled={
                      correlationSensors.length >= 2 &&
                      !correlationSensors.includes(sensor.value)
                    }
                  />

                  {sensor.label}

                </label>

              ))}

            </div>

          </div>

        )}

        <hr className="setting-divider" />

        {/* グラフ期間 */}
        <div className="setting-section">

          <p className="section-title">グラフ期間</p>

          <div className="period-radio">

            <label>
              <input
                type="radio"
                name="period"
                value="day"
                checked={graphPeriod === "day"}
                onChange={(e) =>
                  setGraphPeriod(e.target.value)
                }
              />
              日
            </label>

            <label>
              <input
                type="radio"
                name="period"
                value="month"
                checked={graphPeriod === "month"}
                onChange={(e) =>
                  setGraphPeriod(e.target.value)
                }
              />
              月
            </label>

            <label>
              <input
                type="radio"
                name="period"
                value="year"
                checked={graphPeriod === "year"}
                onChange={(e) =>
                  setGraphPeriod(e.target.value)
                }
              />
              年
            </label>

          </div>

        </div>

        <hr className="setting-divider" />

        {/* 期間 */}
        <div className="setting-section">

          <p className="section-title">期間</p>

          {periods.map((period) => (

            <div
              className="period-card"
              key={period.id}
            >

              <div
                className="period-color"
                style={{
                  backgroundColor: period.color,
                }}
              />

              <input
                type="date"
                value={period.date}
                onChange={(e) =>
                  updatePeriodDate(
                    period.id,
                    e.target.value
                  )
                }
              />

              <button
                className="delete-button"
                onClick={() =>
                  deletePeriod(period.id)
                }
              >
                ×
              </button>

            </div>

          ))}

          {/* 期間を５コまでにするやつ */}
          {periods.length < 5 && (

            <button
              className="add-period-button"
              onClick={addPeriod}
            >
              ＋期間を追加
            </button>

          )}

        </div>

        {/* OKボタン */}
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