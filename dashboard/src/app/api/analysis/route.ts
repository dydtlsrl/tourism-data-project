
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const regionCode =
    request.nextUrl.searchParams.get("region_code") ?? "11";

  // 서울 전체 또는 서울 자치구 코드만 허용
  if (!/^11(?:\d{3})?$/.test(regionCode)) {
    return NextResponse.json(
      { error: "올바르지 않은 지역 코드입니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // 선택 지역의 가장 최근 AI 분석 결과 조회
    const { data, error } = await supabase
      .from("ai_region_analysis")
      .select(
        "region_code, analysis_date, summary, limitations, llm_provider, model_name"
      )
      .eq("region_code", regionCode)
      .order("analysis_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("AI 분석 조회 오류:", error.message);

      return NextResponse.json(
        { error: "분석 결과를 조회하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        region_code: regionCode,
        available: data !== null,
        data: data ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("AI 지역 분석 API 오류:", error);

    return NextResponse.json(
      { error: "서버 연결 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
