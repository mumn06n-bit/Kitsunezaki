
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageLayout from "@/components/PageLayout";
import {
  fetchSensorData,
  type SensorRecord,
} from "@/services/sensorData";

import "./map.css";

// 地図上のセンサー位置 ※固定
const sensors = [
  {
    id: "DO01",
    latitude: 38.357483,
    longitude: 141.4206,
    type: "do",
  },
  {
    id: "DO02",
    latitude: 38.352,
    longitude: 141.412,
    type: "do",
  },
  {
    id: "DO03",
    latitude: 38.347083,
    longitude: 141.410017,
    type: "do",
  },
  {
    id: "塩分",
    latitude: 38.356,
    longitude: 141.412,
    type: "salinity",
  },
] as const;

type PositionSensorId =
  | "DO01"
  | "DO02"
  | "DO03"
  | "salinity";

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 選択中のセンサー
  const [selectedSensor, setSelectedSensor] = useState<string>(
    location.state?.selectedSensor ?? "DO01"
  );

  // APIから取得したデータ
  const [sensorData, setSensorData] =
    useState<SensorRecord | null>(null);

  // APIデータ取得
  useEffect(() => {
    let ignore = false;

    const loadSensorData = async () => {
      try {
        // 当日分を取得。共通キャッシュが有効なら再利用する
        const records = await fetchSensorData();

        if (ignore) return;

        if (records.length === 0) {
          console.warn("センサデータがありません");
          setSensorData(null);
          return;
        }

        // 日時を比較して最新データを選択
        const latest = records.reduce((newest, current) =>
          current.datetime > newest.datetime
            ? current
            : newest
        );

        console.log("取得した最新データ:", latest);
        console.log("取得した位置情報:", latest.positions);

        setSensorData(latest);
      } catch (error) {
        console.error(
          "センサデータの取得に失敗しました:",
          error
        );

        if (!ignore) {
          setSensorData(null);
        }
      }
    };

    loadSensorData();

    return () => {
      ignore = true;
    };
  }, []);

  // DOセンサー選択
  const handleSensorSelect = (sensorId: string) => {
    if (sensorId === "塩分") return;

    setSelectedSensor(sensorId);
  };

  // OKボタン
  const handleOk = () => {
    navigate("/settings", {
      state: {
        selectedSensor,
      },
    });
  };

  // DOセンサーアイコン
  const createDoIcon = (sensorId: string) => {
    const isSelected = sensorId === selectedSensor;

    return L.divIcon({
      className: "sensor-marker-wrapper",
      html: `
        <div class="sensor-marker ${
          isSelected ? "selected" : ""
        }">
          ${sensorId}
        </div>
      `,
      iconSize: [60, 36],
      iconAnchor: [30, 18],
    });
  };

  // 塩分センサーアイコン
  const createSalinityIcon = () => {
    return L.divIcon({
      className: "salinity-marker-wrapper",
      html: `
        <div class="salinity-marker">
          塩分
        </div>
      `,
      iconSize: [60, 36],
      iconAnchor: [30, 18],
    });
  };

  // センサー位置の表示
  const renderPosition = (sensorId: PositionSensorId) => {
    if (!sensorData) {
      return (
        <>
          <span>緯度：取得中...</span>
          <span>経度：取得中...</span>
        </>
      );
    }

    const position = sensorData.positions?.[sensorId];

    if (
      !position ||
      !position.latitudeDMS ||
      !position.longitudeDMS
    ) {
      return (
        <>
          <span>緯度：取得できません</span>
          <span>経度：取得できません</span>
        </>
      );
    }

    return (
      <>
        <span>緯度：{position.latitudeDMS}</span>
        <span>経度：{position.longitudeDMS}</span>
      </>
    );
  };

  return (
    <PageLayout title="地図" showBackButton={true}>
      <div className="map-page">
        {/* 地図 */}
        <div className="map-area">
          <MapContainer
            center={[
              sensors[0].latitude,
              sensors[0].longitude,
            ]}
            zoom={14}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            zoomControl={false}
            maxBounds={[
              [38.342, 141.41],
              [38.362, 141.425],
            ]}
            maxBoundsViscosity={1.0}
            className="sensor-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {sensors.map((sensor) => (
              <Marker
                key={sensor.id}
                position={[
                  sensor.latitude,
                  sensor.longitude,
                ]}
                icon={
                  sensor.type === "salinity"
                    ? createSalinityIcon()
                    : createDoIcon(sensor.id)
                }
                eventHandlers={{
                  click: () => handleSensorSelect(sensor.id),
                }}
              />
            ))}
          </MapContainer>
        </div>

        {/* 選択中のセンサー */}
        <div className="selected-sensor">
          選択中：
          <strong>{selectedSensor}</strong>
        </div>

        {/* OKボタン */}
        <div className="map-ok-button-area">
          <button
            className="map-ok-button"
            onClick={handleOk}
          >
            OK
          </button>
        </div>

        {/* センサー位置情報 */}
        <div className="sensor-location-list">
          <div className="sensor-location">
            <strong>DO01</strong>
            {renderPosition("DO01")}
          </div>

          <div className="sensor-location">
            <strong>DO02</strong>
            {renderPosition("DO02")}
          </div>

          <div className="sensor-location">
            <strong>DO03</strong>
            {renderPosition("DO03")}
          </div>

          <div className="sensor-location">
            <strong>塩分</strong>
            {renderPosition("salinity")}
          </div>

          {/* データ取得日時 */}
          <div className="sensor-data-time">
            <strong>データ取得日時：</strong>
            {sensorData
              ? sensorData.datetime.replace("T", " ")
              : "取得中..."}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}