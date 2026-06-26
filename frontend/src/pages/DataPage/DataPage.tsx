import "./DataPage.css";
import Header from "@/components/Header";

export default function DataPage() {
  return (
    <div className="data-page">

      {/* タイトル */}
      <header>
        <Header title="データ" />
      </header>

      {/* 日付・時間 */}
      <section className="date-area">
        <h2>2026年</h2>
      </section>

      {/* センサから取得したデータ */}
      <main className="data-area">
        <p>気温</p>
        <p>水温</p>
      </main>

    </div>
  );
}