import PageLayout from "@/components/PageLayout";
import "./SettingPage.css";
//import Header from "./Header";

export default function SettingPage() {
  return (
    <PageLayout title="設定">
      <div className="settingpage-area">
        
      <div>
       <label className="settingpage-label">DOセンサ</label>
       <select>
         <option value="DO01">DO01</option>
         <option value="DO02">DO02</option>
         <option value="DO03">DO03</option>
       </select>
      </div>

      {/* 横線 */}
      <hr className="setting-divider" />
    
      {/* 適正値設定の見出し */}
      <h2 className="settingpage-title">適正値設定</h2>

        <div>
          <label className="settingpage-label">水温</label>
          <select>
            <option>20.5℃</option>
          </select>
        </div>

        <div>
          <label className="settingpage-label">塩分濃度</label>
          <select>
            <option>28‰</option>
          </select>
        </div>

        <div>
          <label className="settingpage-label">溶存酸素</label>
          <select>
            <option>12mg/L</option>
          </select>
        </div>
      </div>
    </PageLayout>
  );
}