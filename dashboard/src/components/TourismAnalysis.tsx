
"use client";

import { useEffect, useState } from "react";

// Supabase에 저장된 AI 분석 결과
type AIAnalysis = {
  region_code: string;
  analysis_date: string;
  summary: string | null;
  limitations: string | null;
  llm_provider: string | null;
  model_name: string | null;
};

// 규칙 기반 자동 분석 결과
type RuleAnalysis = {
  region_code: string;
  reference_date: string;
  region_type: string;
  summary: string;
  limitations: string;
  metrics: {
    stay_strength: number;
    consumption_strength: number;
    median_stay: number;
    median_consumption: number;
    compared_regions: number;
  };
};

type SavedAnalysisResponse = {
  available: boolean;
  data: AIAnalysis | null;
};

type RuleAnalysisResponse = {
  available: boolean;
  mode: "rule_based";
  data: RuleAnalysis | null;
};

type AnalysisResult =
  | { kind: "ai"; data: AIAnalysis }
  | { kind: "rule"; data: RuleAnalysis }
  | null;

type Props = {
  selectedRegionCode: string;
};

// 지수를 소수점 둘째 자리까지 표시
function formatNumber(value: number) {
  return value.toFixed(2);
}

export default function TourismAnalysis({
  selectedRegionCode,
}: Props) {
  const [analysis, setAnalysis] =
    useState<AnalysisResult>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 선택한 지역이 바뀌면 분석 결과 재조회
  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalysis() {
      setLoading(true);
      setError(false);
      setAnalysis(null);

      try {
        const query = encodeURIComponent(
          selectedRegionCode
        );

        // 1. 저장된 AI 분석 결과 먼저 확인
        const savedResponse = await fetch(
          `/api/analysis?region_code=${query}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!savedResponse.ok) {
          throw new Error("AI 분석 조회 실패");
        }

        const saved: SavedAnalysisResponse =
          await savedResponse.json();

        // 2. 실제 AI 분석 결과가 존재하면 우선 사용
        if (saved.available && saved.data) {
          if (!controller.signal.aborted) {
            setAnalysis({
              kind: "ai",
              data: saved.data,
            });
          }

          return;
        }

        // 3. 저장된 AI 분석이 없다면
        // 규칙 기반 자동 분석 결과 조회
        const ruleResponse = await fetch(
          `/api/analysis/summary?region_code=${query}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!ruleResponse.ok) {
          throw new Error("자동 분석 조회 실패");
        }

        const rule: RuleAnalysisResponse =
          await ruleResponse.json();

        if (!controller.signal.aborted) {
          if (rule.available && rule.data) {
            setAnalysis({
              kind: "rule",
              data: rule.data,
            });
          } else {
            setAnalysis(null);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("지역 분석 오류:", err);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => controller.abort();
  }, [selectedRegionCode]);

  const isAI = analysis?.kind === "ai";
  const isRule = analysis?.kind === "rule";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* 제목 및 상태 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            지역 관광 데이터 분석
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            실제 관광 수요 데이터를 활용한 지역별 분석
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {loading
            ? "조회 중"
            : error
              ? "조회 오류"
              : isAI
                ? "AI 분석"
                : isRule
                  ? "규칙 기반 자동 분석"
                  : "분석 데이터 없음"}
        </span>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="mt-5 flex h-36 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          지역 분석 결과를 불러오는 중...
        </div>
      )}

      {/* 조회 오류 */}
      {!loading && error && (
        <div className="mt-5 rounded-xl bg-red-50 p-6 text-sm text-red-600">
          분석 결과를 조회하지 못했습니다.
        </div>
      )}

      {/* 분석 데이터 없음 */}
      {!loading && !error && !analysis && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <p className="font-medium text-slate-700">
            현재 표시할 분석 데이터가 없습니다.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            관광 수요 데이터가 저장되면
            규칙 기반 분석을 표시할 수 있습니다.
          </p>
        </div>
      )}

      {/* 실제 AI 모델이 생성한 분석 */}
      {!loading && !error && analysis?.kind === "ai" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-blue-50 p-5">
            <h3 className="font-semibold text-blue-800">
              AI 지역 분석 요약
            </h3>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {analysis.data.summary ||
                "저장된 분석 요약이 없습니다."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold">
              분석 한계 및 주의사항
            </h3>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {analysis.data.limitations ||
                "별도로 기록된 분석 한계가 없습니다."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span>
              분석 기준일: {analysis.data.analysis_date}
            </span>

            {analysis.data.llm_provider && (
              <span>
                AI 제공자: {analysis.data.llm_provider}
              </span>
            )}

            {analysis.data.model_name && (
              <span>
                모델: {analysis.data.model_name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 실제 데이터 기반 규칙 분석 */}
      {!loading && !error && analysis?.kind === "rule" && (
        <div className="mt-5 space-y-4">
          {/* 관광 수요 유형 */}
          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-xs font-medium text-blue-600">
              관광 수요 유형
            </p>

            <h3 className="mt-2 text-xl font-bold text-blue-800">
              {analysis.data.region_type}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-700">
              {analysis.data.summary}
            </p>
          </div>

          {/* 실제 데이터 지표 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                선택 지역 체류 강도
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(
                  analysis.data.metrics.stay_strength
                )}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                자치구 중앙값:{" "}
                {formatNumber(
                  analysis.data.metrics.median_stay
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                선택 지역 소비 강도
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(
                  analysis.data.metrics.consumption_strength
                )}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                자치구 중앙값:{" "}
                {formatNumber(
                  analysis.data.metrics.median_consumption
                )}
              </p>
            </div>
          </div>

          {/* 분석 기준 및 한계 */}
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold">
              분석 기준 및 한계
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {analysis.data.limitations}
            </p>
          </div>

          {/* 분석 정보 */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span>
              기준일: {analysis.data.reference_date}
            </span>

            <span>
              비교 지역:{" "}
              {analysis.data.metrics.compared_regions}개
            </span>

            <span>
              분석 방식: 규칙 기반
            </span>
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
        관광 수요 지수는 실제 방문객 수나 매출액이
        아닙니다. 지역 유형은 서울 자치구 간
        상대적인 비교 결과이며, 규칙 기반 분석은
        AI 모델이 생성한 결과가 아닙니다.
      </p>
    </section>
  );
}
