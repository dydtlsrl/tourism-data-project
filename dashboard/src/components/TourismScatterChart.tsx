
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

type RegionData = {
  region_code: string;
  region_name: string;
  stay_strength: number;
  consumption_strength: number;
};

type CompareResponse = {
  reference_date: string | null;
  data: RegionData[];
};

type Props = {
  selectedRegionCode: string;
  onRegionChange: (code: string) => void;
};

// 자치구 지수의 중앙값 계산
function median(values: number[]) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export default function TourismScatterChart({
  selectedRegionCode,
  onRegionChange,
}: Props) {
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 서울 25개 자치구 데이터 조회
  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await fetch("/api/demand/compare", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("지역 비교 데이터 조회 실패");
        }

        const json: CompareResponse = await response.json();

        if (!controller.signal.aborted) {
          setResult(json);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadData();

    return () => controller.abort();
  }, []);

  const data = useMemo(() => result?.data ?? [], [result]);

  // 4분면 구분을 위한 중앙값
  const medianStay = useMemo(
    () => median(data.map((d) => d.stay_strength)),
    [data]
  );

  const medianConsumption = useMemo(
    () => median(data.map((d) => d.consumption_strength)),
    [data]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            지역별 관광 수요 분석
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            서울 25개 자치구의 체류·소비 강도 비교
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700">
          {result?.reference_date ?? "데이터 조회 중"}
        </span>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center text-sm text-slate-400">
          데이터를 불러오는 중...
        </div>
      ) : error ? (
        <div className="flex h-80 items-center justify-center text-sm text-red-500">
          관광 수요 데이터를 불러오지 못했습니다.
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-80 items-center justify-center text-sm text-slate-400">
          표시할 지역 데이터가 없습니다.
        </div>
      ) : (
        <>
          <div className="mt-5 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 15, right: 20, bottom: 15, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  type="number"
                  dataKey="stay_strength"
                  name="체류 강도"
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "체류 강도",
                    position: "insideBottom",
                    offset: -10,
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="consumption_strength"
                  name="소비 강도"
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tick={{ fontSize: 11 }}
                  width={48}
                />

                <ZAxis type="number" range={[110, 110]} />

                {/* 4분면 기준선 */}
                <ReferenceLine
                  x={medianStay}
                  stroke="#64748b"
                  strokeDasharray="5 5"
                />

                <ReferenceLine
                  y={medianConsumption}
                  stroke="#64748b"
                  strokeDasharray="5 5"
                />

                {/* 마우스를 올렸을 때 실제 지역 정보 표시 */}
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    const point = payload[0].payload as
                      | RegionData
                      | undefined;

                    if (!point) return null;

                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
                        <p className="mb-2 font-semibold">
                          {point.region_name}
                        </p>
                        <p>
                          체류 강도: {point.stay_strength.toFixed(2)}
                        </p>
                        <p>
                          소비 강도: {point.consumption_strength.toFixed(2)}
                        </p>
                      </div>
                    );
                  }}
                />

                <Scatter
                  name="서울 자치구"
                  data={data}
                  fill="#94a3b8"
                  onClick={(point: unknown) => {
                    const selected = (
                      point as { payload?: RegionData }
                    )?.payload;

                    if (selected?.region_code) {
                      onRegionChange(selected.region_code);
                    }
                  }}
                >
                  {data.map((point) => {
                    const isSelected =
                      point.region_code === selectedRegionCode;

                    return (
                      <Cell
                        key={point.region_code}
                        fill={isSelected ? "#2563eb" : "#94a3b8"}
                        stroke={isSelected ? "#1d4ed8" : "#ffffff"}
                        strokeWidth={isSelected ? 3 : 1}
                        cursor="pointer"
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 p-3">
              <strong>소비 우세형</strong>
              <p className="mt-1 text-slate-500">체류↓ 소비↑</p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <strong>체류·소비 우세형</strong>
              <p className="mt-1 text-slate-500">체류↑ 소비↑</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <strong>체류·소비 열세형</strong>
              <p className="mt-1 text-slate-500">체류↓ 소비↓</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <strong>체류 우세형</strong>
              <p className="mt-1 text-slate-500">체류↑ 소비↓</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            점선은 서울 자치구의 중앙값입니다.
            파란색 점은 현재 선택한 지역을 나타냅니다.
            지역 간 상대 비교이며 절대적인 관광 성과 등급은 아닙니다.
          </p>
        </>
      )}
    </section>
  );
}
