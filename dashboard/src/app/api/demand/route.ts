
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const regionCode =
    request.nextUrl.searchParams.get("region_code") ?? "11";

  // 서울 전체(11) 또는 서울 자치구(5자리) 코드만 허용
  if (!/^11(?:\d{3})?$/.test(regionCode)) {
    return NextResponse.json(
      { error: "올바르지 않은 지역 코드입니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("tourism_demand")
      .select(
        "region_code, reference_date, stay_strength, consumption_strength"
      )
      .eq("region_code", regionCode)
      .order("reference_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("관광 수요 조회 오류:", error.message);
      throw error;
    }

    return NextResponse.json(
      { data: data ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "관광 수요 데이터를 조회하지 못했습니다." },
      { status: 500 }
    );
  }
}
