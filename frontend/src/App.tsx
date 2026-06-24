import { Routes, Route } from "react-router-dom";

import DataPage from "./pages/DataPage/DataPage";
import GraphPage from "./pages/GraphPage/GraphPage";
import ComparePage from "./pages/ComparePage/ComparePage";
import SettingsPage from "./pages/SettingPage/SettingPage";

import BottomNavigation from "./components/BottomNavigation";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DataPage />} />
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