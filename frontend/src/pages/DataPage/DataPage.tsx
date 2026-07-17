
import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";
import { useState } from "react";
import { Link } from "react-router-dom";//カレンダーへの遷移
import { useLocation } from "react-router-dom";

// 時間を30分刻みの配列で定義
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

// 現在時刻から最新の30分単位の時間を取得
const getLatestTime = () => {
  const now = new Date();

  const hour = now.getHours();
  const minute = now.getMinutes();

  // 30分単位で切り捨て
  const roundedMinute = minute < 30 ? "00" : "30";

  return `${hour}:${roundedMinute}`;
};

export default function DataPage() {
  // calendarPageから情報を受け取る
  const location = useLocation();
    // 選択された日付を管理
const [selectedDate, setSelectedDate] = useState(
  location.state?.selectedDate
    ? new Date(location.state.selectedDate)
    : new Date()
);

// 表示する時間を管理
const [time, setTime] = useState(getLatestTime());
    const formatDate = (date: Date) => {
      const month  = date.getMonth() + 1; // 月は0から始まるので+1する
      const day = date.getDate();
      const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]; // 曜日を取得

    return `${month}月${day}日（${week}）`;
    };


  return (
    <PageLayout title="データ">

      {/* 日付と時間を表示 */}
      <section className="date-area">
        <div className="date-icon">
           {/* カレンダーアイコンの挿入 */}
        <Link to="/calendar" className="calendar-link" state={{ selectedDate }}>
          <Icons.CalendarRange size={30} />
        </Link>

        </div>

        {/* リロードボタン */}
<button
  className="reload-button"
  onClick={() => {
    // パソコンの現在日時を取得
     // TODO: API実装後は、最新データの日時を取得する
    const now = new Date();

    // 日付を今日に更新
    setSelectedDate(now);

    // 時間を最新の30分単位に更新
     // TODO: API実装後は、APIから取得した時刻を設定する
    setTime(getLatestTime());
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
          ℃
        </div>
        
      </section>

      <section className="sensor-data-area">
        <div className="data-row">
          <span>水温</span>
          ℃
        </div>
        
      </section>

      <section className="sensor-data-area">
        <div className="data-row">
        <span>塩分濃度</span>
        ‰
        </div>
      </section>

      <section className="sensor-data-area">
        <div className="data-row">
        <span>溶存酸素</span>
        mg/L
        </div>
      </section>


    </PageLayout>
  );
}