
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type TrendRow = {
  reference_date: string;
  keyword: string;
  ratio: number | string | null;
};

export async function GET() {
  try {
    // 서버 전용 Supabase 클라이언트
    const supabase = getSupabaseAdmin();

    // 최근 데이터부터 조회 (최대 500행)
    const { data, error } = await supabase
      .from("naver_trend")
      .select("reference_date, keyword, ratio")
      .order("reference_date", { ascending: false })
      .order("keyword", { ascending: true })
      .limit(500);

    if (error) {
      console.error("NAVER Trend 조회 실패:", error.message);

      return NextResponse.json(
        { error: "검색 트렌드 데이터를 조회하지 못했습니다." },
        { status: 500 }
      );
    }

    // 차트에서 사용할 수 있도록 숫자 형식 정리
    const trends = ((data ?? []) as TrendRow[])
      .filter(
        (row) =>
          row.reference_date &&
          row.keyword &&
          row.ratio !== null
      )
      .map((row) => ({
        reference_date: row.reference_date,
        keyword: row.keyword,
        ratio: Number(row.ratio),
      }))
      .filter((row) => Number.isFinite(row.ratio))
      .sort(
        (a, b) =>
          a.reference_date.localeCompare(b.reference_date) ||
          a.keyword.localeCompare(b.keyword)
      );

    return NextResponse.json(
      {
        data: trends,
        count: trends.length,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("NAVER Trend API 오류:", error);

    return NextResponse.json(
      { error: "서버 연결 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
