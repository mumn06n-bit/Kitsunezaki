import "./Calendar.css";

import PageLayout from "@/components/PageLayout";
import { Icons } from "@/components/materials";

export default function CalendarPage() {
  return (
    <PageLayout title="日付選択" showBackButton={true}>

      {/* 戻るボタン */}
      <section className="calendar-header">
        <button className="back-button">
          <Icons.Undo2 size={30} />
        </button>
      </section>

      {/* カレンダー表示エリア */}
      <section className="calendar-area">

        {/* ここに後でカレンダーを配置 */}

      </section>

    </PageLayout>
  );
}