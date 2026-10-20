from pathlib import Path
import pandas as pd

# 원본 데이터 폴더
RAW_DIR = Path(__file__).resolve().parent / "raw"

# CSV 파일 읽기
stay = pd.read_csv(
    RAW_DIR / "tourism_stay_202609_seoul.csv",
    dtype=str
)

consumption = pd.read_csv(
    RAW_DIR / "tourism_consumption_202609_seoul.csv",
    dtype=str
)

# 데이터 기본 정보 확인
print("체류 데이터:", stay.shape)
print("소비 데이터:", consumption.shape)

print("\n[체류 데이터 컬럼]")
print(stay.columns.tolist())

print("\n[소비 데이터 컬럼]")
print(consumption.columns.tolist())

print("\n[체류 데이터 미리보기]")
print(stay.head(3).to_string(index=False))

print("\n[소비 데이터 미리보기]")
print(consumption.head(3).to_string(index=False))

# 1. 데이터 연결 기준
keys = ["baseYm", "areaCd", "signguCd"]

# 2. 두 데이터 병합
merged = pd.merge(
    stay,
    consumption,
    on=keys,
    how="outer",
    indicator=True,
    validate="one_to_one"
)

# 3. 병합 결과 확인
print("\n[데이터 병합 결과]")
print(merged["_merge"].value_counts())

print("\n[병합된 데이터 미리보기]")
print(merged[
    ["baseYm", "signguCd",
     "tarSjrnDsIxVal", "tarExpDsIxVal"]
].head().to_string(index=False))

# 4. 병합 결과 검증
if not merged["_merge"].eq("both").all():
    raise ValueError("병합되지 않은 지역 데이터가 있습니다.")

# 5. Supabase 저장용 데이터 생성
result = pd.DataFrame()

# 기준월을 날짜 형식으로 변환
result["reference_date"] = pd.to_datetime(
    merged["baseYm"], format="%Y%m"
).dt.strftime("%Y-%m-01")

# 지역 코드 정리 (서울 전체: 11, 자치구: 5자리 코드)
result["region_code"] = merged["signguCd"].where(
    merged["signguCd"] != "0",
    merged["areaCd"]
)

# 관광 강도 값을 숫자로 변환
result["stay_strength"] = pd.to_numeric(
    merged["tarSjrnDsIxVal"], errors="coerce"
)

result["consumption_strength"] = pd.to_numeric(
    merged["tarExpDsIxVal"], errors="coerce"
)

# 6. 필수 데이터 검증
if result.isna().any().any():
    raise ValueError("변환한 데이터에 결측값이 있습니다.")

# 7. CSV 저장
OUT_DIR = Path(__file__).resolve().parent / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

output = OUT_DIR / "tourism_demand_seed.csv"
result.to_csv(output, index=False, encoding="utf-8-sig")

print("\n[최종 전처리 결과]")
print(result.head().to_string(index=False))
print("저장된 데이터:", len(result), "행")
print("저장 위치:", output)