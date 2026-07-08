import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";

export default function DataPage() {
  return (
    <PageLayout title="データ">

      <section className="date-area">
        <span>7月8日</span>
        {/* アイコンの挿入 */}
        <Icons.CalendarRange size={30} />
      </section>

      <section className="data-area">
        <span>気温</span>
      </section>

    </PageLayout>
  );
}
