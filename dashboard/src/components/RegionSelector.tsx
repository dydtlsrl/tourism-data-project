
"use client";

import { useEffect, useState } from "react";

type Region = {
  region_code: string;
  region_name: string;
};

type RegionSelectorProps = {
  selectedRegionCode: string;
  onRegionChange: (regionCode: string) => void;
};

export default function RegionSelector({
  selectedRegionCode,
  onRegionChange,
}: RegionSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Supabase 지역 데이터 불러오기
  useEffect(() => {
    let active = true;

    async function loadRegions() {
      try {
        const response = await fetch("/api/regions");

        if (!response.ok) {
          throw new Error("지역 조회 실패");
        }

        const result = await response.json();

        if (!Array.isArray(result.data)) {
          throw new Error("잘못된 데이터 형식");
        }

        if (active) {
          setRegions(result.data);
        }
      } catch (error) {
        console.error("지역 목록 조회 오류:", error);

        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRegions();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
      <label htmlFor="region" className="text-slate-500">
        지역 ·
      </label>

      <select
        id="region"
        value={selectedRegionCode}
        onChange={(e) => onRegionChange(e.target.value)}
        disabled={loading || error}
        className="max-w-52 bg-transparent text-sm outline-none"
      >
        {loading && (
          <option value="11">불러오는 중...</option>
        )}

        {error && (
          <option value="11">지역 조회 실패</option>
        )}

        {regions.map((region) => (
          <option
            key={region.region_code}
            value={region.region_code}
          >
            {region.region_name}
          </option>
        ))}
      </select>
    </div>
  );
}
