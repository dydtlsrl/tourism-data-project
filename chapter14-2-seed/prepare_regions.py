from pathlib import Path
import pandas as pd

# 1. 프로젝트 폴더 경로 설정
BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
OUTPUT = BASE_DIR / "processed" / "regions.csv"

# 2. 관광 체류 데이터 파일 자동 탐색
files = sorted(RAW_DIR.glob("tourism_stay_*.csv"))

if not files:
    raise FileNotFoundError("관광 체류 CSV 파일이 없습니다.")

regions_list = []

for file in files:
    # 3. 원본 데이터 읽기 (지역 코드는 문자열로 유지)
    df = pd.read_csv(file, dtype=str, encoding="utf-8-sig")

    required = ["areaCd", "areaNm", "signguCd", "signguNm"]
    df = df[required].fillna("")

    # 4. 서울 전체와 자치구를 자동 구분
    is_total = df["signguCd"] == "0"

    df["region_code"] = df["signguCd"].where(
        ~is_total, df["areaCd"]
    )

    df["region_name"] = df["areaNm"].where(
        is_total, df["areaNm"] + " " + df["signguNm"]
    )

# 지역 코드와 이름을 목록에 추가
regions_list.append(df[["region_code", "region_name"]])

# 모든 지역 데이터 합치기
regions = pd.concat(regions_list, ignore_index=True)

# 중복 데이터 제거
regions = regions.drop_duplicates()

# 중복 지역 코드 검증
if regions["region_code"].duplicated().any():
    raise ValueError("지역 코드 중복이 발견됐습니다.")

# 지역 코드 기준 정렬
regions = regions.sort_values("region_code")

# CSV 저장
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
regions.to_csv(OUTPUT, index=False, encoding="utf-8-sig")

print(f"[PASS] 지역 데이터 {len(regions)}건 생성")
print(f"[SAVE] {OUTPUT}")