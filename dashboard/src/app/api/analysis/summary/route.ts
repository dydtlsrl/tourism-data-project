
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type DemandData = {
  region_code: string;
  stay_strength: number;
  consumption_strength: number;
};

// 중앙값 계산
function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// 체류·소비 강도에 따른 상대적 지역 유형
function classifyRegion(
  stay: number,
  consumption: number,
  medianStay: number,
  medianConsumption: number
) {
  const highStay = stay >= medianStay;
  const highConsumption = consumption >= medianConsumption;

  if (highStay && highConsumption) {
    return "체류·소비 우세형";
  }

  if (highStay) {
    return "체류 우세형";
  }

  if (highConsumption) {
    return "소비 우세형";
  }

  return "체류·소비 열세형";
}

export async function GET(request: NextRequest) {
  const regionCode =
    request.nextUrl.searchParams.get("region_code") ?? "11";

  // 서울 지역 코드 검증
  if (!/^11(?:\d{3})?$/.test(regionCode)) {
    return NextResponse.json(
      { error: "올바르지 않은 지역 코드입니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. 가장 최근 관광 수요 기준일 확인
    const { data: latest, error: latestError } =
      await supabase
        .from("tourism_demand")
        .select("reference_date")
        .order("reference_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestError) throw latestError;

    if (!latest) {
      return NextResponse.json({
        available: false,
        mode: "rule_based",
        data: null,
      });
    }

    // 2. 최근 기준일의 관광 수요 조회
    const { data: rows, error: demandError } =
      await supabase
        .from("tourism_demand")
        .select(
          "region_code, stay_strength, consumption_strength"
        )
        .eq("reference_date", latest.reference_date)
        .limit(100);

    if (demandError) throw demandError;

    // 3. 숫자 및 지역 코드 정리
    const demand: DemandData[] = (rows ?? [])
      .filter(
        (row) =>
          row.stay_strength !== null &&
          row.consumption_strength !== null
      )
      .map((row) => ({
        region_code: String(row.region_code),
        stay_strength: Number(row.stay_strength),
        consumption_strength: Number(
          row.consumption_strength
        ),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.stay_strength) &&
          Number.isFinite(row.consumption_strength)
      );

    // 4. 서울 25개 자치구만 비교 대상으로 사용
    const districts = demand.filter((row) =>
      /^11\d{3}$/.test(row.region_code)
    );

    const selected = demand.find(
      (row) => row.region_code === regionCode
    );

    if (!selected || districts.length === 0) {
      return NextResponse.json({
        available: false,
        mode: "rule_based",
        data: null,
      });
    }

    // 5. 자치구 중앙값 계산
    const medianStay = median(
      districts.map((row) => row.stay_strength)
    );

    const medianConsumption = median(
      districts.map((row) => row.consumption_strength)
    );

    // 6. 선택한 지역의 관광 수요 유형 결정
    const isSeoulTotal = regionCode === "11";

    const regionType = isSeoulTotal
      ? "서울 전체"
      : classifyRegion(
          selected.stay_strength,
          selected.consumption_strength,
          medianStay,
          medianConsumption
        );

    // 7. 실제 수치에 근거한 요약 생성
    const summary = isSeoulTotal
      ? [
          `서울 전체의 체류 강도는 ${selected.stay_strength.toFixed(2)},`,
          `소비 강도는 ${selected.consumption_strength.toFixed(2)}입니다.`,
          `현재 ${districts.length}개 자치구의 관광 수요 자료가`,
          "비교 데이터로 확보되어 있습니다.",
        ].join(" ")
      : [
          `선택 지역은 ${regionType}으로 분류됩니다.`,
          `체류 강도는 ${selected.stay_strength.toFixed(2)},`,
          `소비 강도는 ${selected.consumption_strength.toFixed(2)}입니다.`,
          `서울 자치구 중앙값은 체류 ${medianStay.toFixed(2)},`,
          `소비 ${medianConsumption.toFixed(2)}입니다.`,
          "이 분류는 자치구 간 상대적인 위치를 나타냅니다.",
        ].join(" ");

    // 8. 분석 한계 명시
    const limitations = [
      "이 결과는 규칙 기반 자동 분석이며 AI 모델이 생성한 내용이 아닙니다.",
      "현재 확보된 최신 월의 관광 수요 지수만 사용합니다.",
      "검색 트렌드와 장소 검색 결과는 이 분류에 포함하지 않습니다.",
      "지수의 상대적인 차이가 실제 방문객 수나 매출의 차이를 의미하지는 않습니다.",
    ].join(" ");

    // 9. 분석 결과 반환
    return NextResponse.json(
      {
        available: true,
        mode: "rule_based",
        data: {
          region_code: regionCode,
          reference_date: latest.reference_date,
          region_type: regionType,
          summary,
          limitations,
          metrics: {
            stay_strength: selected.stay_strength,
            consumption_strength:
              selected.consumption_strength,
            median_stay: medianStay,
            median_consumption: medianConsumption,
            compared_regions: districts.length,
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("자동 분석 생성 오류:", error);

    return NextResponse.json(
      { error: "자동 분석을 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
