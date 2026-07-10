import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";

export default function DataPage() {
  return (
    <PageLayout title="データ">

      {/* 日付と時間を表示 */}
      <section className="date-area">
        <span>7月8日</span>
        {/* アイコンの挿入 */}
        <Icons.CalendarRange size={30} />
      </section>

      {/* センサから取得したデータを表示 */}
      <section className="sensor-data-area">
        <span>気温</span>
      </section>

    </PageLayout>
  );
}
