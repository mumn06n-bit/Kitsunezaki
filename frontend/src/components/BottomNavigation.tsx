import { NavLink } from "react-router-dom";
import "./BottomNavigation.css"
import { Icons } from "@/components/materials";//アイコンのインポート

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      <NavLink to="/data" className="nav-item">
        <Icons.Newspaper size={30} />
      </NavLink>

      <NavLink to="/graph" className="nav-item">
        <Icons.ChartLine size={30} />
      </NavLink>

      <NavLink to="/compare" className="nav-item">
        <Icons.ChartNoAxesCombined size={30} />
      </NavLink>

      <NavLink to="/settings" className="nav-item">
        <Icons.Settings size={30} />
      </NavLink>
    </nav>
  );
}