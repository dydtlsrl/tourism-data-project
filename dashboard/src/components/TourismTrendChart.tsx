
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Supabase에서 조회한 검색 트렌드 데이터
type TrendData = {
  reference_date: string;
  keyword: string;
  ratio: number;
};

type TrendResponse = {
  data: TrendData[];
  count: number;
};

// 차트에서 사용하는 색상
const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

// 월별 데이터를 그래프 형태로 변환
function prepareChartData(data: TrendData[]) {
  const keywords = [
    ...new Set(data.map((item) => item.keyword)),
  ].sort();

  const monthlyData = new Map<
    string,
    Record<string, string | number>
  >();

  data.forEach((item) => {
    const month = item.reference_date.slice(0, 7);
    const keywordIndex = keywords.indexOf(item.keyword);
    const seriesKey = `series_${keywordIndex}`;

    if (!monthlyData.has(month)) {
      monthlyData.set(month, { month });
    }

    const row = monthlyData.get(month);

    if (row) {
      row[seriesKey] = item.ratio;
    }
  });

  return {
    keywords,
    chartData: [...monthlyData.values()].sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    ),
  };
}

export default function TourismTrendChart() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // NAVER 검색 트렌드 API 조회
  useEffect(() => {
    const controller = new AbortController();

    async function loadTrends() {
      try {
        const response = await fetch("/api/trends", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("검색 트렌드 조회 실패");
        }

        const result: TrendResponse = await response.json();

        if (!Array.isArray(result.data)) {
          throw new Error("잘못된 데이터 형식");
        }

        if (!controller.signal.aborted) {
          setTrends(result.data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("검색 트렌드 오류:", error);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTrends();

    return () => controller.abort();
  }, []);

  // 키워드별 데이터를 월 단위로 정리
  const { keywords, chartData } = useMemo(
    () => prepareChartData(trends),
    [trends]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            NAVER 검색 트렌드
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            키워드별 월간 검색 관심도 변화
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700">
          월간 데이터
        </span>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center text-sm text-slate-400">
          검색 트렌드를 불러오는 중...
        </div>
      ) : error ? (
        <div className="flex h-80 items-center justify-center text-sm text-red-500">
          검색 트렌드 데이터를 불러오지 못했습니다.
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-80 items-center justify-center text-sm text-slate-400">
          표시할 검색 트렌드 데이터가 없습니다.
        </div>
      ) : (
        <>
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 15,
                  left: -15,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value: string) =>
                    value.slice(2)
                  }
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  width={45}
                />

                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number"
                      ? value.toFixed(2)
                      : value,
                    name,
                  ]}
                  labelFormatter={(label) =>
                    `${label} 검색 관심도`
                  }
                />

                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{
                    fontSize: 12,
                    paddingTop: 12,
                  }}
                />

                {/* 검색 키워드별 선 자동 생성 */}
                {keywords.map((keyword, index) => (
                  <Line
                    key={keyword}
                    type="monotone"
                    dataKey={`series_${index}`}
                    name={keyword}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-600">
              비교 키워드: {keywords.join(" · ")}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              NAVER 데이터랩의 상대적 검색 관심도
              지수입니다. 실제 검색 횟수를 의미하지
              않으며 자치구별 검색량도 아닙니다.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
