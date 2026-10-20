
import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버에서만 사용하는 Supabase 관리자 클라이언트
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 환경변수가 없으면 연결하지 않고 오류 처리
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase 서버 환경변수가 설정되지 않았습니다.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
