
import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";
import { Link } from "react-router-dom";//カレンダーへの遷移
import { useState } from "react";

// 時間を配列で定義
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
    const today = new Date();
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
        <Link to="/calendar" className="calendar-link">
          <Icons.CalendarRange size={30} />
        </Link>
        </div>
        
        <div className="date-text-group">
          <span className="date-text">{formatDate(today)}</span>
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