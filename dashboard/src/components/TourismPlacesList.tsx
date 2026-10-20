
"use client";

import { useMemo, useState } from "react";

// Supabase API가 반환하는 장소 데이터
export type TourismPlace = {
  place_key: string;
  name: string;
  category: string | null;
  category_codes: string[];
  address: string | null;
  road_address: string | null;
  longitude: number | null;
  latitude: number | null;
  source_link: string | null;
};

type Props = {
  places: TourismPlace[];
  loading: boolean;
  error: string | null;
};

// 검색 카테고리의 화면 표시 이름
const CATEGORY_LABELS: Record<string, string> = {
  attraction: "관광지",
  restaurant: "맛집",
  cafe: "카페",
  accommodation: "숙박",
};

function categoryLabel(code: string) {
  return CATEGORY_LABELS[code] ?? code;
}

// 외부 링크는 HTTP/HTTPS만 허용
function safeLink(link: string | null) {
  if (!link) return null;

  try {
    const url = new URL(link);

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function TourismPlacesList({
  places,
  loading,
  error,
}: Props) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // 실제 데이터에 존재하는 카테고리만 추출
  const categories = useMemo(
    () =>
      [
        ...new Set(
          places.flatMap((place) => place.category_codes)
        ),
      ].sort(),
    [places]
  );

  // 지역 변경 후 선택한 카테고리가 사라지면 전체 표시
  const activeCategory =
    categoryFilter === "all" ||
    categories.includes(categoryFilter)
      ? categoryFilter
      : "all";

  // 카테고리 및 장소명 필터
  const filteredPlaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return places.filter((place) => {
      const matchesCategory =
        activeCategory === "all" ||
        place.category_codes.includes(activeCategory);

      const matchesSearch =
        !keyword ||
        place.name.toLowerCase().includes(keyword) ||
        (place.address ?? "").toLowerCase().includes(keyword) ||
        (place.road_address ?? "").toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [places, activeCategory, search]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* 제목 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            관광 장소 목록
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            선택한 지역의 검색된 관광 장소
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {loading ? "조회 중" : `${places.length}개 장소`}
        </span>
      </div>

      {/* 검색 및 카테고리 필터 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="장소명 또는 주소 검색"
          aria-label="장소 검색"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <select
          aria-label="장소 카테고리"
          value={activeCategory}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">전체 카테고리</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      {/* 조회 상태에 따른 화면 */}
      {loading ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-400">
          장소 데이터를 불러오는 중...
        </div>
      ) : error ? (
        <div className="flex h-72 items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : places.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-center text-sm text-slate-400">
          이 지역에 수집된 장소가 아직 없습니다.
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-400">
          검색 조건에 일치하는 장소가 없습니다.
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs text-slate-500">
            검색 결과 {filteredPlaces.length}건
          </p>

          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {filteredPlaces.map((place) => {
              const link = safeLink(place.source_link);

              return (
                <article
                  key={place.place_key}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">
                      {place.name}
                    </h3>

                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-blue-600 hover:underline"
                      >
                        상세보기 ↗
                      </a>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {place.road_address ||
                      place.address ||
                      "주소 정보 없음"}
                  </p>

                  {/* 장소가 발견된 검색 카테고리 */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {place.category_codes.map((code) => (
                      <span
                        key={code}
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        {categoryLabel(code)}
                      </span>
                    ))}

                    {place.category && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {place.category}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-slate-400">
        NAVER Local 검색 결과 기준입니다.
        검색 지역과 장소의 실제 행정구역은 다를 수 있습니다.
      </p>
    </section>
  );
}
