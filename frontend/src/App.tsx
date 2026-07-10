import { Routes, Route, Navigate } from "react-router-dom";

import DataPage from "./pages/DataPage/DataPage";
import GraphPage from "./pages/GraphPage/GraphPage";
import ComparePage from "./pages/ComparePage/ComparePage";
import SettingsPage from "./pages/SettingPage/SettingPage";

import BottomNavigation from "./components/BottomNavigation";

//画面遷移の設定
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/data" replace />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      <BottomNavigation />
    </>
  );
}

export default App;