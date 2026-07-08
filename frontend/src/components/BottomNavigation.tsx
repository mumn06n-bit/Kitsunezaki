import { NavLink } from "react-router-dom";
import "./BottomNavigation.css"

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      <NavLink
        to="/data"
        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
  データ
</NavLink>

      <NavLink to="/graph" className="nav-item">
        グラフ
      </NavLink>

      <NavLink to="/compare" className="nav-item">
        比較
      </NavLink>

      <NavLink to="/settings" className="nav-item">
        設定
      </NavLink>
    </nav>
  );
}