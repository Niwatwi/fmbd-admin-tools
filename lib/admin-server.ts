import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function requireSharedAdmin() {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(changes) {
          try {
            changes.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();
  if (error || !user?.email || !user.email_confirmed_at) {
    throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ");
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    throw new Error(
      "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่งเซิร์ฟเวอร์",
    );
  const database = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  const { data: profile, error: profileError } = await database
    .from("user_profiles")
    .select("id, username, employee_id, company_tag, is_active")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();
  if (profileError || !profile)
    throw new Error("ไม่พบบัญชีผู้ดูแลระบบที่ได้รับอนุญาต");
  const adminNames = new Set(["ADMIN", "ADMIN_NIWAT", "FMBD03"]);
  const isAdmin = [
    profile.username,
    profile.employee_id,
    profile.company_tag,
  ].some((value) =>
    adminNames.has(
      String(value || "")
        .trim()
        .toUpperCase(),
    ),
  );
  if (!isAdmin) throw new Error("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
  return { database, user, profile };
}
