
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

    // 1. 선택 지역에 연결된 장소 검색 결과
    const { data: matches, error: matchError } =
      await supabase
        .from("local_place_search_matches")
        .select("place_key, category_code")
        .eq("region_code", regionCode)
        .limit(200);

    if (matchError) throw matchError;

    if (!matches?.length) {
      return NextResponse.json({
        region_code: regionCode,
        count: 0,
        data: [],
      });
    }

    // 2. 중복 장소 키 제거
    const placeKeys = [
      ...new Set(matches.map((row) => row.place_key)),
    ];

    // 3. 장소 상세 정보 조회
    const { data: places, error: placeError } =
      await supabase
        .from("local_places")
        .select(
          "place_key, name, category, address, road_address, longitude, latitude, source_link"
        )
        .in("place_key", placeKeys)
        .limit(200);

    if (placeError) throw placeError;

    // 4. 장소별 검색 카테고리 연결
    const categoryMap = new Map<string, Set<string>>();

    for (const match of matches) {
      if (!categoryMap.has(match.place_key)) {
        categoryMap.set(match.place_key, new Set());
      }

      categoryMap.get(match.place_key)?.add(
        match.category_code
      );
    }

    // 5. 대시보드에서 필요한 정보만 반환
    const data = (places ?? []).map((place) => ({
      place_key: place.place_key,
      name: place.name,
      category: place.category,
      category_codes: [
        ...(categoryMap.get(place.place_key) ?? []),
      ],
      address: place.address,
      road_address: place.road_address,
      longitude: place.longitude,
      latitude: place.latitude,
      source_link: place.source_link,
    }));

    return NextResponse.json(
      {
        region_code: regionCode,
        count: data.length,
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("관광 장소 조회 오류:", error);

    return NextResponse.json(
      { error: "관광 장소 데이터를 조회하지 못했습니다." },
      { status: 500 }
    );
  }
}
