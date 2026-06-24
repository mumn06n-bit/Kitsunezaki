import { Link } from "react-router-dom";

export default function BottomNavigation() {
  return (
    <nav>
      <Link to="/data">データ</Link> |
      <Link to="/graph">グラフ</Link> |
      <Link to="/compare">比較</Link> |
      <Link to="/settings">設定</Link>
    </nav>
  );
}