
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. 가장 최근 관광 수요 기준일 확인
    const { data: latest, error: latestError } = await supabase
      .from("tourism_demand")
      .select("reference_date")
      .order("reference_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    if (!latest) {
      return NextResponse.json({
        reference_date: null,
        data: [],
      });
    }

    // 2. 최근 기준일의 관광 수요와 지역명 조회
    const [demandResult, regionResult] = await Promise.all([
      supabase
        .from("tourism_demand")
        .select(
          "region_code, stay_strength, consumption_strength"
        )
        .eq("reference_date", latest.reference_date)
        .limit(100),

      supabase
        .from("regions")
        .select("region_code, region_name")
        .limit(100),
    ]);

    if (demandResult.error) throw demandResult.error;
    if (regionResult.error) throw regionResult.error;

    // 3. 지역 코드와 지역명 연결
    const regionNames = new Map(
      (regionResult.data ?? []).map((region) => [
        String(region.region_code),
        region.region_name,
      ])
    );

    // 4. 서울 전체(11)를 제외한 25개 자치구만 추출
    const data = (demandResult.data ?? [])
      .filter((row) =>
        /^11\d{3}$/.test(String(row.region_code))
      )
      .filter(
        (row) =>
          row.stay_strength !== null &&
          row.consumption_strength !== null
      )
      .map((row) => ({
        region_code: String(row.region_code),
        region_name:
          regionNames.get(String(row.region_code)) ??
          String(row.region_code),
        stay_strength: Number(row.stay_strength),
        consumption_strength: Number(
          row.consumption_strength
        ),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.stay_strength) &&
          Number.isFinite(row.consumption_strength)
      )
      .sort((a, b) =>
        a.region_code.localeCompare(b.region_code)
      );

    return NextResponse.json(
      {
        reference_date: latest.reference_date,
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("관광 수요 비교 조회 실패:", error);

    return NextResponse.json(
      { error: "지역 비교 데이터를 조회하지 못했습니다." },
      { status: 500 }
    );
  }
}
