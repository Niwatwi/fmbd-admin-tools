"use server";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { requireSharedAdmin } from "@/lib/admin-server";

const scrypt = promisify(scryptCallback);
const fields =
  "id, username, employee_id, display_name, company_tag, area, email, phone, employment_type, base_salary, customer_id, image_url, is_active";

export async function ensureSharedPasswordReadyAction() {
  try {
    await requireSharedAdmin();
    if (process.env.PASSWORD_HASH_UPGRADE_ENABLED !== "true")
      throw new Error(
        "ยังไม่เปิดเปลี่ยนรหัสผ่าน จนกว่าระบบที่ใช้บัญชีร่วมรองรับรหัสผ่านแบบแฮช",
      );
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "ตรวจสอบสิทธิ์ไม่สำเร็จ" };
  }
}

async function passwordHash(passwordInput: string) {
  if (process.env.PASSWORD_HASH_UPGRADE_ENABLED !== "true")
    throw new Error(
      "ยังไม่เปิดเปลี่ยนรหัสผ่าน จนกว่าระบบที่ใช้บัญชีร่วมรองรับรหัสผ่านแบบแฮช",
    );
  const password = String(passwordInput || "").trim();
  if (password.length < 8 || password.length > 128)
    throw new Error("รหัสผ่านต้องมี 8–128 ตัวอักษร");
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$v1$${salt}$${hash.toString("hex")}`;
}

type ProfileInput = {
  customer_id: string;
  area: string;
  username: string;
  password_text: string;
  display_name: string;
  company_tag: string;
  email: string;
  phone: string;
  employee_id: string;
  employment_type: string;
  base_salary: string;
  is_active: boolean;
  image_url: string;
};

function safeProfile(input: ProfileInput) {
  const value = {
    customer_id: String(input.customer_id || "").trim(),
    area: String(input.area || "").trim(),
    username: String(input.username || "").trim(),
    display_name: String(input.display_name || "").trim(),
    company_tag: String(input.company_tag || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    employee_id: String(input.employee_id || "").trim(),
    employment_type: String(input.employment_type || "").trim(),
    base_salary: String(input.base_salary || "").trim(),
    image_url: String(input.image_url || "").trim(),
    is_active: input.is_active === true,
  };
  if (
    !value.username ||
    !value.display_name ||
    !value.company_tag ||
    !value.area
  )
    throw new Error("กรุณากรอกชื่อผู้ใช้ ชื่อ กลุ่ม และ Area");
  return value;
}

export async function listSharedUsersAction() {
  try {
    const { database } = await requireSharedAdmin();
    const users: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await database
        .from("user_profiles")
        .select(fields)
        .order("id", { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      users.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return { data: users, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ" };
  }
}

export async function getSharedUserAction(id: number) {
  try {
    const { database } = await requireSharedAdmin();
    if (!Number.isInteger(id) || id <= 0)
      throw new Error("รหัสผู้ใช้ไม่ถูกต้อง");
    const { data, error } = await database
      .from("user_profiles")
      .select(fields)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ไม่พบผู้ใช้");
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ" };
  }
}

export async function listSharedUserOptionsAction() {
  try {
    const { database } = await requireSharedAdmin();
    const { data, error } = await database
      .from("user_profiles")
      .select("username, display_name")
      .order("display_name");
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ" };
  }
}

export async function getPayrollUserAction(username: string) {
  try {
    const { database } = await requireSharedAdmin();
    const selectedUsername = String(username || "").trim();
    if (!selectedUsername) throw new Error("กรุณาเลือกผู้ใช้");
    const { data, error } = await database
      .from("user_profiles")
      .select(
        "username, display_name, employee_id, company_tag, base_salary, employment_type, image_url",
      )
      .eq("username", selectedUsername)
      .maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "โหลดข้อมูลพนักงานไม่สำเร็จ" };
  }
}

export async function createSharedUserAction(input: ProfileInput) {
  try {
    const { database } = await requireSharedAdmin();
    const payload = {
      ...safeProfile(input),
      password_text: await passwordHash(input.password_text),
    };
    const { error } = await database.from("user_profiles").insert(payload);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "สร้างบัญชีไม่สำเร็จ" };
  }
}

export async function updateSharedUserAction(id: number, input: ProfileInput) {
  try {
    const { database, profile } = await requireSharedAdmin();
    if (!Number.isInteger(id) || id <= 0)
      throw new Error("รหัสผู้ใช้ไม่ถูกต้อง");
    const payload: Record<string, unknown> = safeProfile(input);
    if (id === profile.id && payload.is_active === false)
      throw new Error("ไม่สามารถระงับบัญชีตนเองได้");
    if (input.password_text)
      payload.password_text = await passwordHash(input.password_text);
    const { data, error } = await database
      .from("user_profiles")
      .update(payload)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ไม่พบผู้ใช้");
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "แก้ไขบัญชีไม่สำเร็จ" };
  }
}

export async function setSharedUserActiveAction(id: number, isActive: boolean) {
  try {
    const { database, profile } = await requireSharedAdmin();
    if (!Number.isInteger(id) || id <= 0 || typeof isActive !== "boolean")
      throw new Error("ข้อมูลผู้ใช้ไม่ถูกต้อง");
    if (id === profile.id && !isActive)
      throw new Error("ไม่สามารถระงับบัญชีตนเองได้");
    const { data, error } = await database
      .from("user_profiles")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ไม่พบผู้ใช้");
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "แก้ไขสถานะไม่สำเร็จ" };
  }
}

export async function deleteSharedUserAction(id: number) {
  try {
    const { database, profile } = await requireSharedAdmin();
    if (!Number.isInteger(id) || id <= 0 || id === profile.id)
      throw new Error("ไม่สามารถลบบัญชีนี้ได้");
    const { error: accountError } = await database
      .from("koe_accounts")
      .delete()
      .eq("user_id", id);
    if (accountError) throw accountError;
    const { data, error } = await database
      .from("user_profiles")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("ไม่พบผู้ใช้");
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "ลบบัญชีไม่สำเร็จ" };
  }
}
