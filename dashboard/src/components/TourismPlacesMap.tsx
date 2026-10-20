
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { TourismPlace } from "@/components/TourismPlacesList";

type Props = {
  places: TourismPlace[];
  loading: boolean;
  error: string | null;
};

const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;

const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.978,
};

// 지도에 표시할 수 있는 좌표인지 확인
function hasValidCoordinates(place: TourismPlace) {
  return (
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    place.longitude >= -180 &&
    place.longitude <= 180
  );
}

export default function TourismPlacesMap({
  places,
  loading,
  error,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  const [activated, setActivated] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<
    string | null
  >(null);

  // NAVER Maps SDK가 준비되면 지도 생성
  useEffect(() => {
    if (!sdkReady || !containerRef.current) return;

    const map = new naver.maps.Map(containerRef.current, {
      center: new naver.maps.LatLng(
        SEOUL_CENTER.lat,
        SEOUL_CENTER.lng
      ),
      zoom: 11,
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => {
        naver.maps.Event.clearInstanceListeners(marker);
        marker.setMap(null);
      });

      markersRef.current = [];
      mapRef.current = null;
    };
  }, [sdkReady]);

  // 장소 데이터가 변경되면 마커 갱신
  useEffect(() => {
    const map = mapRef.current;

    if (!sdkReady || !map) return;

    // 이전 마커 제거
    markersRef.current.forEach((marker) => {
      naver.maps.Event.clearInstanceListeners(marker);
      marker.setMap(null);
    });

    markersRef.current = [];

    const validPlaces = places.filter(hasValidCoordinates);

    if (validPlaces.length === 0) {
      map.setCenter(
        new naver.maps.LatLng(
          SEOUL_CENTER.lat,
          SEOUL_CENTER.lng
        )
      );
      map.setZoom(11);
      return;
    }

    const positions: naver.maps.LatLng[] = [];

    // Supabase 실제 장소 좌표로 마커 생성
    validPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(
        place.latitude!,
        place.longitude!
      );

      positions.push(position);

      const marker = new naver.maps.Marker({
        position,
        map,
        title: place.name,
      });

      // 마커 클릭 시 장소 상세 표시
      naver.maps.Event.addListener(marker, "click", () => {
        setSelectedPlaceKey(place.place_key);
      });

      markersRef.current.push(marker);
    });

    // 마커 개수에 맞춰 지도 이동
    if (positions.length === 1) {
      map.setCenter(positions[0]);
      map.setZoom(14);
    } else {
      const bounds = new naver.maps.LatLngBounds(
        positions[0],
        positions[0]
      );

      positions.forEach((position) => {
        bounds.extend(position);
      });

      map.fitBounds(bounds);
    }
  }, [places, sdkReady]);

  const validCount = places.filter(hasValidCoordinates).length;

  const selectedPlace = places.find(
    (place) => place.place_key === selectedPlaceKey
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            관광 장소 지도
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            NAVER Maps 기반 관광 장소 위치
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700">
          {validCount}개 마커
        </span>
      </div>

      {!clientId ? (
        <div className="mt-5 flex h-80 items-center justify-center rounded-xl bg-slate-50 p-5 text-center text-sm text-red-500">
          NAVER Maps Client ID가 설정되지 않았습니다.
        </div>
      ) : !activated ? (
        <div className="mt-5 flex h-80 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            관광 장소의 위치를 지도에서 확인하세요.
          </p>

          <button
            type="button"
            onClick={() => setActivated(true)}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            지도 불러오기
          </button>

          <p className="text-xs text-slate-400">
            버튼을 누르면 NAVER Maps API를 호출합니다.
          </p>
        </div>
      ) : (
        <>
          {/* NAVER Maps 공식 JavaScript SDK */}
          <Script
            id="naver-maps-sdk"
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`}
            strategy="afterInteractive"
            onReady={() => setSdkReady(true)}
            onError={() => setSdkError(true)}
          />

          {sdkError && (
            <p className="mt-4 text-sm text-red-500">
              지도 SDK를 불러오지 못했습니다.
              Client ID와 등록된 Web 서비스 URL을 확인하세요.
            </p>
          )}

          <div className="relative mt-5">
            <div
              ref={containerRef}
              className="h-80 w-full overflow-hidden rounded-xl bg-slate-100"
              aria-label="관광 장소 지도"
            />

            {!sdkReady && !sdkError && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                NAVER 지도를 불러오는 중...
              </div>
            )}
          </div>
        </>
      )}

      {/* 조회 결과 안내 */}
      {loading ? (
        <p className="mt-4 text-xs text-slate-500">
          장소 데이터를 조회하고 있습니다.
        </p>
      ) : error ? (
        <p className="mt-4 text-xs text-red-500">{error}</p>
      ) : validCount === 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          선택한 지역에 좌표가 있는 수집 장소가 없습니다.
        </p>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          지도에 표시된 마커를 클릭하면 장소 정보를 확인할 수 있습니다.
        </p>
      )}

      {/* 클릭한 마커의 장소 정보 */}
      {activated && selectedPlace && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="font-semibold text-slate-800">
            {selectedPlace.name}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {selectedPlace.road_address ||
              selectedPlace.address ||
              "주소 정보 없음"}
          </p>

          {selectedPlace.category && (
            <p className="mt-2 text-xs text-blue-700">
              {selectedPlace.category}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">
        NAVER Local 검색 결과에 저장된 좌표를 사용합니다.
        검색 지역과 실제 장소 위치는 다를 수 있습니다.
      </p>
    </section>
  );
}
