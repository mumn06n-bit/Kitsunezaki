import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import { Link } from "react-router-dom";//カレンダーへの遷移
import PageLayout from "@/components/PageLayout";

export default function DataPage() {
  return (
    <PageLayout title="データ">

      {/* 日付と時間を表示 */}
      <section className="date-area">
        <span>7月8日</span>
        {/* カレンダーアイコンの挿入 */}
        <Link to="/calendar" className="calendar-link">
          <Icons.CalendarRange size={30} />
        </Link>
      </section>

      {/* センサから取得したデータを表示 */}
      <section className="sensor-data-area">
        <span>気温</span>
      </section>

    </PageLayout>
  );
}
