
"use client";

import { useEffect, useState } from "react";

import RegionSelector from "@/components/RegionSelector";
import TourismScatterChart from "@/components/TourismScatterChart";
import TourismTrendChart from "@/components/TourismTrendChart";
import TourismPlacesList from "@/components/TourismPlacesList";
import TourismPlacesMap from "@/components/TourismPlacesMap";
import TourismAnalysis from "@/components/TourismAnalysis";

import type { TourismPlace } from "@/components/TourismPlacesList";

// 관광 수요 데이터 타입
type TourismDemand = {
  region_code: string;
  reference_date: string;
  stay_strength: number | null;
  consumption_strength: number | null;
};

// 대시보드 기본 지표 카드
const metrics = [
  { label: "분석 지역", value: "—", unit: "개 지역" },
  { label: "체류 강도", value: "—", unit: "지수" },
  { label: "소비 강도", value: "—", unit: "지수" },
  { label: "검색된 장소", value: "—", unit: "개 장소" },
];

// 지수 출력 형식
function formatValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "—";
}

export default function Home() {
  // 1. 현재 선택된 지역
  const [regionCode, setRegionCode] = useState("11");

  // 2. 관광 수요 데이터
  const [demand, setDemand] = useState<TourismDemand | null>(
    null
  );

  const [demandLoading, setDemandLoading] = useState(true);

  const [demandError, setDemandError] = useState<
    string | null
  >(null);

  // 3. 관광 장소 데이터
  const [places, setPlaces] = useState<TourismPlace[]>([]);

  const [placesLoading, setPlacesLoading] = useState(true);

  const [placesError, setPlacesError] = useState<
    string | null
  >(null);

  // 4. 선택 지역의 관광 수요 조회
  useEffect(() => {
    const controller = new AbortController();

    async function loadDemand() {
      setDemandLoading(true);
      setDemandError(null);
      setDemand(null);

      try {
        const response = await fetch(
          `/api/demand?region_code=${encodeURIComponent(regionCode)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("관광 수요 조회 실패");
        }

        const result: { data: TourismDemand | null } =
          await response.json();

        if (!controller.signal.aborted) {
          setDemand(result.data ?? null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("관광 수요 조회 오류:", error);
          setDemandError("관광 수요 조회 실패");
        }
      } finally {
        if (!controller.signal.aborted) {
          setDemandLoading(false);
        }
      }
    }

    void loadDemand();

    return () => controller.abort();
  }, [regionCode]);

  // 5. 선택 지역의 관광 장소 조회
  // 지도와 장소 목록에서 동일한 데이터 공유
  useEffect(() => {
    const controller = new AbortController();

    async function loadPlaces() {
      setPlacesLoading(true);
      setPlacesError(null);
      setPlaces([]);

      try {
        const response = await fetch(
          `/api/places?region_code=${encodeURIComponent(regionCode)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("관광 장소 조회 실패");
        }

        const result: { data: TourismPlace[] } =
          await response.json();

        if (!Array.isArray(result.data)) {
          throw new Error("잘못된 장소 데이터 형식");
        }

        if (!controller.signal.aborted) {
          setPlaces(result.data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("관광 장소 조회 오류:", error);
          setPlacesError("관광 장소 조회 실패");
        }
      } finally {
        if (!controller.signal.aborted) {
          setPlacesLoading(false);
        }
      }
    }

    void loadPlaces();

    return () => controller.abort();
  }, [regionCode]);

  // 6. 관광 수요 연결 상태
  const statusText = demandLoading
    ? "관광 수요 불러오는 중"
    : demandError
      ? demandError
      : demand
        ? "관광 수요 연결 완료"
        : "선택 지역의 관광 수요 데이터 없음";

  // 7. 실제 데이터 기반 지표 카드
  const displayMetrics = metrics.map((metric) => {
    if (metric.label === "체류 강도") {
      return {
        ...metric,
        value: formatValue(demand?.stay_strength),
      };
    }

    if (metric.label === "소비 강도") {
      return {
        ...metric,
        value: formatValue(demand?.consumption_strength),
      };
    }

    if (metric.label === "검색된 장소") {
      return {
        ...metric,
        value:
          placesLoading || placesError
            ? "—"
            : String(places.length),
      };
    }

    return metric;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">

        {/* 사이드바 */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-6 lg:block">
          <div className="text-xl font-bold tracking-tight text-blue-700">
            TOURISM DATA
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Seoul Analytics
          </p>

          <nav className="mt-12 space-y-3 text-sm">

            <div className="rounded-lg bg-blue-50 px-4 py-3 font-semibold text-blue-700">
              대시보드
            </div>

            <div className="px-4 py-3 text-slate-500">
              관광 수요 분석
            </div>

            <div className="px-4 py-3 text-slate-500">
              검색 트렌드
            </div>

            <div className="px-4 py-3 text-slate-500">
              관광 장소
            </div>

            <div className="px-4 py-3 text-slate-500">
              AI 지역 분석
            </div>

          </nav>
        </aside>

        {/* 메인 영역 */}
        <main className="min-w-0 flex-1 p-5 md:p-8">

          {/* 상단 헤더 */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm font-medium text-blue-600">
                SEOUL TOURISM ANALYTICS
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                관광 데이터 대시보드
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                지역별 관광 수요, 검색 관심도,
                관광 장소를 분석합니다.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
              {statusText}
            </span>

          </header>

          {/* 분석 조건 */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <p className="text-sm font-semibold">
              분석 조건
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">

              {/* 지역 선택 */}
              <RegionSelector
                selectedRegionCode={regionCode}
                onRegionChange={setRegionCode}
              />

              {/* 관광 수요 기준일 */}
              <span className="rounded-lg bg-slate-100 px-4 py-2">
                관광 수요 기준 ·{" "}
                {demand?.reference_date ?? "—"}
              </span>

              {/* 데이터 연결 상태 */}
              <span className="rounded-lg bg-slate-100 px-4 py-2">
                상태 · {statusText}
              </span>

            </div>
          </div>

          {/* 주요 관광 지표 카드 */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {displayMetrics.map((metric) => (
              <section
                key={metric.label}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >

                <p className="text-sm text-slate-500">
                  {metric.label}
                </p>

                <div className="mt-4 flex items-baseline gap-2">

                  <strong className="text-3xl">
                    {metric.value}
                  </strong>

                  <span className="text-xs text-slate-400">
                    {metric.unit}
                  </span>

                </div>

              </section>
            ))}

          </div>

          {/* 관광 수요 및 검색 트렌드 */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* 25개 자치구 관광 수요 산점도 */}
            <TourismScatterChart
              selectedRegionCode={regionCode}
              onRegionChange={setRegionCode}
            />

            {/* NAVER 월별 검색 트렌드 */}
            <TourismTrendChart />

          </div>

          {/* 관광 장소 지도 및 목록 */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {/* NAVER Maps 지도 */}
            <TourismPlacesMap
              places={places}
              loading={placesLoading}
              error={placesError}
            />

            {/* 관광 장소 목록 */}
            <TourismPlacesList
              places={places}
              loading={placesLoading}
              error={placesError}
            />

          </div>

          {/* AI 지역 분석 */}
          <div className="mt-6">

            <TourismAnalysis
              selectedRegionCode={regionCode}
            />

          </div>

        </main>
      </div>
    </div>
  );
}
