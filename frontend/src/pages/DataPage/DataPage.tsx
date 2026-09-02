import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";//カレンダーへの遷移

// 時間を30分刻みの配列で定義
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

// 現在時刻から最新の30分単位の時間を取得
const getLatestTime = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = now.getMinutes();

  // 30分単位で切り捨て
  const roundedMinute = minute < 30 ? "00" : "30";

  return `${hour}:${roundedMinute}`;
};

//日付の表示フォーマット関数
const formatDate = (date: Date) => {
  const month = date.getMonth() + 1; // 月は0から始まるので+1する
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]; // 曜日を取得

  return `${month}月${day}日（${week}）`;
};

//--APIデータ仮置き（API直接叩いてます）---------
import Papa from "papaparse";
//---ここまで-----------------------------------

export default function DataPage() {
  //--APIデータ仮置き（API直接叩いてます）---------
  const [outsideTemp, setOutsideTemp] = useState<number | null>(null);
  const [waterTemp, setWaterTemp] = useState<number | null>(null);
  const [salinity, setSalinity] = useState<number | null>(null);
  const [doValue, setDoValue] = useState<number | null>(null);
  //---ここまで-----------------------------------

  // calendarPageから日付、時間を受け取る
  const location = useLocation();
  const navigate = useNavigate();
  const [doSensor, setDoSensor] = useState("DO01");
  useEffect(() => {
    const savedDoSensor = localStorage.getItem("doSensor");

    if (savedDoSensor) {
      setDoSensor(savedDoSensor);
    }
  }, []);

  // 選択された日付を管理
  const [selectedDate, setSelectedDate] = useState(
    location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : new Date()
  );

  // 表示する時間を管理
  const [time, setTime] = useState(
    location.state?.time ?? getLatestTime()
  );

  //--APIデータ仮置き（API直接叩いてます）---------
  useEffect(() => {
    const fetchSalinityData = async () => {
      try {
        const response = await fetch("/api/salinity");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        console.log("APIから取得したデータ（塩分）:", data);//デバッグ用

        const parsed = Papa.parse(data, {
          header: false,
          skipEmptyLines: true,
        });

        const rows = parsed.data as string[][];

        console.log("取得した行数（塩分）:", rows.length);//デバッグ用
        console.log("先頭の行（塩分）:", rows[0]);//デバッグ用

        // 選択されている日時に一致するデータを探す
        const targetDate = new Date(selectedDate);
        const targetDateString =
          `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

        console.log("探している日時（塩分）:", targetDateString, time);//デバッグ用

        const targetRow = rows.find((row) => {
          if (!row[1]) return false;

          const utcDate = new Date(row[1]);

          // APIの日時を日本時間に変換
          const jstDate = utcDate.toLocaleDateString("sv-SE", {
            timeZone: "Asia/Tokyo",
          });

          const jstTime = utcDate.toLocaleTimeString("en-GB", {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            jstDate === targetDateString &&
            jstTime === time
          );
        });

        console.log("一致した行（塩分）:", targetRow);//デバッグ用

        if (targetRow) {
          setOutsideTemp(Number(targetRow[3]));
          setWaterTemp(Number(targetRow[4]));
          setSalinity(Number(targetRow[6]));
        } else {
          setOutsideTemp(null);
          setWaterTemp(null);
          setSalinity(null);
        }

      } catch (error) {
        console.error("塩分センサデータの取得に失敗しました:", error);

        setOutsideTemp(null);
        setWaterTemp(null);
        setSalinity(null);
      }
    };

    fetchSalinityData();
  }, [selectedDate, time]);

  useEffect(() => {
    const fetchDoData = async () => {
      try {
        let apiUrl = "";

        if (doSensor === "DO01") {
          apiUrl = "/api/do1";
        } else if (doSensor === "DO03") {
          apiUrl = "/api/do3";
        } else {
          setDoValue(null);
          return;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        //dataの後ろに、選ばれているDOの種類を記載したいのですが、書き方がわかりません；；
        console.log(`APIから取得したデータ（${doSensor}）:`, data,);//デバッグ用

        const parsed = Papa.parse(data, {
          header: false,
          skipEmptyLines: true,
        });

        const rows = parsed.data as string[][];

        console.log(`取得した行（${doSensor}）:`, rows.length);//デバッグ用
        console.log(`先頭の行（${doSensor}）:`, rows[0]);//デバッグ用

        // 選択されている日時に一致するデータを探す
        const targetDate = new Date(selectedDate);
        const targetDateString =
          `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

        console.log(`探している日時（${doSensor}）:`, targetDateString, time);//デバッグ用

        const targetRow = rows.find((row) => {
          if (!row[1]) return false;

          const utcDate = new Date(row[1]);

          // APIの日時を日本時間に変換
          const jstDate = utcDate.toLocaleDateString("sv-SE", {
            timeZone: "Asia/Tokyo",
          });

          const jstTime = utcDate.toLocaleTimeString("en-GB", {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            jstDate === targetDateString &&
            jstTime === time
          );
        });

        console.log(`一致した行（${doSensor}）:`, targetRow);//デバッグ用

        if (targetRow) {
          setDoValue(Number(targetRow[6]));
        } else {
          setDoValue(null);
        }

      } catch (error) {
        console.error("DO1号機データの取得に失敗しました:", error);

        setDoValue(null);
      }
    };

    fetchDoData();
  }, [selectedDate, time, doSensor]);
  //---ここまで-----------------------------------
  return (
    <PageLayout title="データ">

      <section className="data-page-area">
        {/* 日付と時間を表示 */}
        <section className="date-area">
          <div className="date-icon">
            {/* カレンダーアイコンの挿入 */}
            <Link
              to="/calendar"
              className="calendar-link"
              state={{
                selectedDate,
                time,
              }}
            >
              <Icons.CalendarRange size={30} />
            </Link>
          </div>

          {/* リロードボタン */}
          <button
            className="reload-button"
            onClick={() => {
              const now = new Date();
              const latestTime = getLatestTime();

              setSelectedDate(now);
              setTime(latestTime);

              navigate("/data", {
                replace: true,
                state: {
                  selectedDate: now,
                  time: latestTime,
                },
              });
            }}
          >
            <Icons.RefreshCw size={24} />
          </button>
          <div className="date-text-group">
            <span className="date-text">{formatDate(selectedDate)}</span>
            <br />
            {/* 追加　時間を選択する */}
            <select
              className="time-select"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* センサから取得したデータを表示 */}
        <section className="sensor-data-area">
          <div className="data-row">
            <span>気温</span>
            <span>{outsideTemp !== null ? `${outsideTemp}  ℃` : "データなし"}</span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">
            <span>水温</span>
            <span>{waterTemp !== null ? `${waterTemp}  ℃` : "データなし"}</span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">
            <span>塩分濃度</span>
            <span>{salinity !== null ? `${salinity}  ‰` : "データなし"}</span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">
            <div>
              <span>溶存酸素 <small className="sensor-name">({doSensor})</small></span>
            </div>
            <span> {doValue !== null ? `${doValue}  mg/L` : "データなし"}</span>
          </div>
        </section>
      </section>

    </PageLayout>
  );
}