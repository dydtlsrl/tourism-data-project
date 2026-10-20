# 서울 관광 데이터 분석 대시보드

**Tourism Data Project** — 서울 25개 자치구의 관광 수요·검색 관심도·관광 장소를 수집하고 비교하며, AI 지역 분석 결과를 시각화하는 데이터 프로젝트입니다.

> **현재 단계 (2026-10-20):** 데이터 수집 및 분석, Next.js 대시보드 구현, Vercel **비공개 Preview** 배포까지 완료했습니다. Make 시나리오의 **정기 자동 갱신 운영 설정은 보류** 중입니다. 본 저장소는 학습·프로토타입 프로젝트로, 공개 운영 서비스가 아닙니다.

## 주요 기능

| 기능 | 구현 내용 |
| --- | --- |
| 지역 선택 | 서울 전체 및 25개 자치구 선택, 지역 변경에 따른 데이터 재조회 |
| 관광 수요 비교 | 체류 강도·소비 강도 지수, 25개 자치구 산점도 및 중앙값 기준 4분면 비교 |
| 검색 트렌드 | NAVER 데이터랩 키워드별 상대 검색 관심도 월간 추이 |
| 관광 장소 | NAVER Local 검색 결과 목록, 카테고리·장소명 필터 |
| 관광 지도 | NAVER Maps JavaScript SDK, 장소 좌표 마커와 위치 확인 |
| AI 지역 분석 | Supabase에 저장한 Gemini 생성 지역별 요약 및 분석 한계 표시 |
| 보완 분석 | 저장된 AI 분석이 없을 때 관광 수요 지수 기반 규칙형 분석 표시 |

### 수집·분석 현황

2026-10-20 Supabase 조회 기준의 **스냅샷**이며, 이후 데이터 수집에 따라 값이 달라질 수 있습니다.

| 항목 | 확인된 값 |
| --- | ---: |
| AI 지역 분석 완료 | 25개 자치구 |
| 고유 관광 장소 | 498개 |
| 검색 지역·카테고리별 장소 연결 | 520건 |
| 위치 좌표 확보 | 498개 장소 |
| 장소가 저장된 자치구 | 25개 자치구 |

**주의:** 520건은 520개의 서로 다른 장소를 뜻하지 않습니다. 동일한 장소가 여러 검색 조건에서 발견될 수 있으며, 고유 장소는 498개입니다. 이 수치는 **검색 API 결과의 수집량**이지 서울의 전체 관광 시설 수가 아닙니다.

## 데이터 출처 및 해석

| 출처 | 데이터 | 해석 |
| --- | --- | --- |
| 한국관광공사 관광 수요 자료 | 지역별 체류 강도·소비 강도 지수 | 자치구 간 관광 수요의 **상대 비교**에 활용 |
| NAVER 데이터랩 검색어 트렌드 | 키워드별 시계열 검색 관심도 | 상대 검색 관심도 지수; 실제 검색 횟수 또는 자치구별 검색량이 아님 |
| NAVER Local 검색 API | 관광지·맛집·카페·숙박 검색 결과 | 장소명·주소·좌표 및 지도 마커의 원천 |
| Google Gemini | 수요 지수 기반 지역별 분석 문장 | 입력 데이터에 근거한 **AI 생성 요약**으로, 별도 사실 검증을 대체하지 않음 |

관광 수요의 강도 지수는 실제 방문객 수나 매출액 자체가 아닙니다. NAVER 검색 트렌드는 자치구별 수요 데이터와 동일한 모집단·기준을 갖지 않으므로 **직접 JOIN하여 지역 인과관계를 주장하지 않습니다.** NAVER Local 검색 결과의 위치는 검색 대상 자치구와 다를 수 있습니다.

## 시스템 구성

```text
관광 수요 원천 CSV / NAVER DataLab / NAVER Local
                     │
        Python 전처리 / Make 수집 시나리오
                     │
                     ▼
                Supabase
   (regions, tourism_demand, naver_trend,
    local_places, local_place_search_matches)
                     │
          ┌──────────┴──────────┐
          │                     │
     Gemini 분석           Next.js 서버 API
          │                     │
 ai_region_analysis             ▼
          └──────────►  React 대시보드
                        Recharts / NAVER Maps
                               │
                               ▼
                      Vercel Preview 배포
```

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts
- **Backend / DB:** Next.js Route Handlers, Supabase (PostgreSQL)
- **Data pipeline:** Python, Make, NAVER API, 한국관광공사 관광 수요 자료
- **AI:** Google Gemini (지역 분석 생성 결과를 DB에 저장)
- **Deployment:** GitHub → Vercel Preview (Vercel Authentication 적용)

Make 시나리오는 **Make 서비스에서 별도로 관리**합니다. GitHub 저장소를 복제하는 것만으로 Make 연동·DB 테이블·API 인증이 자동 생성되지는 않습니다.

## 저장소 구조

```text
tourism-data-project/
├── README.md
├── chapter14-2-seed/
│   ├── prepare_regions.py       # 지역 코드·이름 CSV 전처리
│   ├── prepare_seed.py          # 관광 수요 지표 병합 및 시드 생성
│   ├── raw/                     # 원본 CSV 자료
│   └── processed/               # 전처리 산출물
└── dashboard/
    ├── README.md                # 대시보드 실행·배포 안내
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx         # 대시보드 메인 화면
    │   │   └── api/             # 서버 데이터 조회 API
    │   ├── components/          # 차트·지역선택·장소·지도·AI 분석
    │   └── lib/supabase/        # 서버 전용 Supabase 클라이언트
    └── package.json
```

## 로컬 실행

Node.js와 npm을 설치하고, 기존 Supabase 프로젝트의 테이블 및 데이터를 준비해야 합니다.

```bash
git clone https://github.com/dydtlsrl/tourism-data-project.git
cd tourism-data-project/dashboard
npm ci
```

`dashboard/.env.local` 파일을 로컬에서 직접 생성합니다.

```dotenv
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-server-only-service-role-key>
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=<your-naver-maps-client-id>
```

```bash
npm run dev
# http://localhost:3000

npm run build
```

- `SUPABASE_SERVICE_ROLE_KEY`는 **서버 전용 비밀키**입니다. 클라이언트 코드, `NEXT_PUBLIC_*` 변수, Git 저장소에 절대 넣지 마세요.
- `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`는 브라우저에서 사용하는 지도 클라이언트 ID입니다. NAVER Cloud Maps 애플리케이션의 **허용 웹사이트 URL**에도 접속 도메인(로컬 및 배포 도메인)을 등록해야 합니다.
- `.env.local`은 Git에서 제외됩니다. 기존 프로젝트의 DB 스키마와 데이터, NAVER Maps API 사용 권한이 없으면 화면 일부가 동작하지 않습니다.

자세한 API 라우트 및 운영 설정은 [dashboard/README.md](dashboard/README.md)를 참고하세요.

## 배포 및 접근 보호

- Vercel 프로젝트의 **Root Directory는 `dashboard`**, Framework Preset은 Next.js입니다.
- `main`: Production 배포 소스 브랜치. **Production 주소에 비공개 인증이 적용된 것으로 간주하지 않습니다.** 이 단계에서는 Production에 Supabase 관리자 키를 등록하지 않습니다.
- `preview/private-test`: 기능 검수용 Preview 배포 브랜치. Vercel Authentication의 로그인 보호를 확인했습니다.
- 민감한 `SUPABASE_SERVICE_ROLE_KEY` 등 서버 환경변수는 **Preview 환경에만 등록**해 테스트합니다.
- 환경변수를 새로 등록하거나 수정한 뒤에는 해당 Preview를 재배포해야 합니다.
- NAVER Maps는 배포 주소를 NAVER Cloud 허용 Web 서비스 URL에 등록해야 정상 표시됩니다.

> **보안:** 현재 서버 API는 Supabase 서비스 역할 키로 데이터를 읽으며, API 라우트 자체에 별도 사용자 인증/인가가 구현되어 있지 않습니다. 따라서 **인증 없는 공개 운영 환경에 관리자 키를 배포하지 마세요.** 공개 서비스 전에는 최소 권한 DB 읽기 역할, RLS/GRANT, 인증 및 요청 제한을 재설계해야 합니다.

## 구현 상태 / 남은 작업

- [x] 서울 25개 자치구 관광 수요 데이터 수집 및 비교
- [x] NAVER 검색 트렌드 시각화
- [x] NAVER Local 장소 데이터 수집 및 목록/지도 표시
- [x] Gemini 지역 분석 25개 자치구 저장·조회
- [x] Next.js 프로덕션 빌드 통과
- [x] GitHub 코드 저장 및 Vercel 비공개 Preview 검수
- [ ] Make 정기 자동 갱신 주기·실패 처리·비용 검토 (**현재 보류**)
- [ ] 공개 서비스 전 API 인증/인가, Supabase 권한 및 RLS 점검
- [ ] 데이터 품질·갱신 기준 및 모니터링 체계 보완

### Make 운영 주의

수집·분석은 실제로 실행하여 데이터를 확보했지만, **모든 시나리오의 정기 자동 실행을 최종 확정한 것은 아닙니다.** 특히 수집 시나리오가 화면상 `Every 15 minutes`로 표시되더라도 그대로 활성화하면 의도치 않은 반복 API 호출과 Make 크레딧 소모가 발생할 수 있습니다. 운영 전 시나리오별 스케줄, 중복 수집 방지, API 한도, 비용을 별도로 점검합니다.

---

**프로젝트 성격:** 서울 관광 데이터의 수집·분석·시각화·AI 활용을 연결한 학습 및 기능 검증용 대시보드입니다.
