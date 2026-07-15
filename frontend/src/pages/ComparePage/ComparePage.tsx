import PageLayout from "@/components/PageLayout";
import { Link } from "react-router-dom";

export default function ComparePage() {
  return (
    <PageLayout title="比較">
      {/* 設定ボタン */}
      <section className="compare-header">
        <Link
          to="/compare-setting"
          className="setting-button"
        >
          設定
        </Link>
      </section>

      <div>
        比較画面
      </div>
    </PageLayout>
  );
}