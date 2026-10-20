
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Supabase 서버 전용 클라이언트
    const supabase = getSupabaseAdmin();

    // 지역 선택에 필요한 컬럼만 조회
    const { data, error } = await supabase
      .from("regions")
      .select("region_code, region_name")
      .order("region_code", { ascending: true })
      .limit(100);

    if (error) {
      console.error("지역 조회 실패:", error.message);

      return NextResponse.json(
        { error: "지역 데이터를 조회하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
    });
  } catch (error) {
    console.error("지역 API 오류:", error);

    return NextResponse.json(
      { error: "서버 연결 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
