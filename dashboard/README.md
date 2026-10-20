# Tourism Dashboard (Next.js)

서울 관광 데이터 분석 프로젝트의 웹 대시보드입니다. 저장소 전체 소개와 데이터 출처는 [상위 README](../README.md)를 참고하세요.

## 구현 기능

- **관광 수요:** 25개 자치구 체류/소비 강도 산점도, 중앙값 기준 비교, 선택 지역 상세 수치
- **검색 트렌드:** NAVER 데이터랩 키워드별 상대 검색 관심도 월간 선 그래프
- **관광 장소:** NAVER Local 검색 결과 목록, 카테고리 및 키워드 필터
- **지도:** NAVER Maps SDK를 사용한 좌표 마커 및 장소 정보
- **지역 분석:** Supabase에 저장된 Gemini AI 분석, 데이터가 없을 때 규칙 기반 분석으로 대체
- **지역 선택:** API 조회 결과를 바탕으로 지역 선택에 따라 관광 수요·장소·분석 결과 갱신

## 기술 스택

- Next.js 16.4.2 (App Router), React 19, TypeScript
- Tailwind CSS 4, Recharts
- Supabase JS SDK / PostgreSQL
- NAVER Maps JavaScript SDK

## 로컬 실행

```bash
cd dashboard
npm ci
```

`dashboard/.env.local`에 다음 변수를 설정합니다. 값을 GitHub에 업로드하지 마세요.

```dotenv
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-server-only-key>
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=<your-naver-maps-client-id>
```

```bash
npm run dev
# http://localhost:3000

npm run build
npm run start
```

- 기존 Supabase DB의 스키마 및 데이터가 있어야 조회 API가 작동합니다.
- 서비스 역할 키는 서버에서만 사용합니다(`src/lib/supabase/admin.ts`).
- `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`는 브라우저 번들에 포함됩니다. 지도 API 사용 권한 및 NAVER Cloud에 등록한 허용 Web 서비스 URL이 필요합니다.

## 서버 API

서버 라우트는 `src/app/api`에 있으며, 대부분 `Cache-Control: no-store`로 현재 DB 데이터를 조회합니다.

| Endpoint | 용도 |
| --- | --- |
| `GET /api/regions` | 서울 전체 및 자치구 목록 |
| `GET /api/demand?region_code=11` | 선택 지역의 최신 관광 수요 지수 |
| `GET /api/demand/compare` | 최신 월 25개 자치구 비교 데이터 |
| `GET /api/trends` | NAVER 검색 트렌드 데이터 |
| `GET /api/places?region_code=11110` | 선택 지역의 관광 장소 목록 |
| `GET /api/analysis?region_code=11110` | 저장된 최신 Gemini AI 지역 분석 |
| `GET /api/analysis/summary?region_code=11110` | 관광 수요 기반 규칙형 분석 |

`region_code=11`은 서울 전체, `11110`은 종로구 등 5자리 값은 자치구를 의미합니다. `GET /api/analysis`에 서울 전체 분석 결과가 없으면 UI가 규칙 기반 분석으로 대체할 수 있습니다.

## 주요 폴더

```text
dashboard/
├── src/
│   ├── app/
│   │   ├── api/                 # 서버 API 라우트
│   │   ├── page.tsx             # 대시보드 홈
│   │   └── globals.css
│   ├── components/
│   │   ├── RegionSelector.tsx
│   │   ├── TourismScatterChart.tsx
│   │   ├── TourismTrendChart.tsx
│   │   ├── TourismPlacesList.tsx
│   │   ├── TourismPlacesMap.tsx
│   │   └── TourismAnalysis.tsx
│   ├── lib/supabase/admin.ts
│   └── types/navermaps.d.ts
├── package.json
└── next.config.ts
```

## Vercel 비공개 Preview 운영

1. Vercel에서 GitHub 저장소를 가져올 때 **Root Directory = `dashboard`**, Framework = Next.js로 지정합니다.
2. `preview/private-test` 브랜치의 **Preview** 배포를 사용하고 Vercel Authentication으로 접근을 제한합니다.
3. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 **Preview 환경에만** 설정합니다.
4. 환경변수 변경 후 Preview를 재배포하고 지도 Web 서비스 URL을 NAVER Cloud에 등록합니다.

> 현재 `main`의 **Production 주소는 공개될 수 있습니다**. 인증되지 않은 공개 환경에 `SUPABASE_SERVICE_ROLE_KEY`를 설정하지 마세요. API는 서비스 역할 키로 조회하며, 자체 인증·인가를 아직 구현하지 않았습니다.

## 데이터 사용 시 주의

- 관광 수요의 체류·소비 **강도 지수**는 실제 방문객 수나 매출액을 뜻하지 않습니다.
- NAVER 검색 트렌드는 상대 관심도이며, 자치구별 검색 횟수와 동일하지 않습니다.
- NAVER Local 검색 장소는 행정구역 밖에 위치할 수 있고 검색 결과가 전수 목록은 아닙니다.
- AI 분석 문장은 원천 지표를 바탕으로 생성된 해석으로, 단독 의사결정 근거가 아닙니다.

## 운영 상태

대시보드 빌드와 비공개 Preview 기능 검수는 완료했습니다. **Make 정기 자동 갱신 설정은 보류**하고 있으며, 자동 수집 운영 전 API 사용량·Make 크레딧·중복 실행·실패 처리를 검토해야 합니다.
