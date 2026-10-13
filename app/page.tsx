"use client";
// 1. นำเข้าคอมโพเนนต์สำหรับลิงก์ข้ามหน้า
import Link from "next/link";
import { useEffect, useState } from "react";

// 2. นำเข้าไอคอนทั้งหมดที่จำเป็นต้องใช้ในหน้านี้ (เพิ่ม ExternalLink และ Sparkles สำหรับโปรเจกต์ Push Girl)
import {
  UserPlus,
  Users,
  LayoutGrid,
  Layers,
  Settings,
  ChevronRight,
  Banknote,
  ClipboardList,
  CalendarDays,
  ExternalLink,
  Sparkles,
  Store,
  X,
  RotateCcw,
} from "lucide-react";

export default function AdminDashboardHome() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [darkMode, setDarkMode] = useState(false);
  const [openExternalInNewTab, setOpenExternalInNewTab] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const cardPadding = compactLayout ? "p-4" : "p-6";
  const pageTheme = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-orange-300 text-slate-800";
  const cardSurface = darkMode
    ? "border-slate-700 bg-slate-900 shadow-black/20"
    : "border-slate-100 bg-white shadow-slate-200/40";
  const cardTitle = darkMode ? "text-slate-100" : "text-slate-900";
  const moduleGrid =
    layoutMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fmbd-dashboard-settings");
      if (saved) {
        const settings = JSON.parse(saved) as {
          compactLayout?: boolean;
          layoutMode?: "grid" | "list";
          darkMode?: boolean;
          openExternalInNewTab?: boolean;
        };
        setCompactLayout(settings.compactLayout ?? false);
        setLayoutMode(settings.layoutMode ?? "grid");
        setDarkMode(settings.darkMode ?? false);
        setOpenExternalInNewTab(settings.openExternalInNewTab ?? true);
      }
    } catch (error) {
      console.error("Failed to load dashboard settings:", error);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem(
      "fmbd-dashboard-settings",
      JSON.stringify({
        compactLayout,
        layoutMode,
        darkMode,
        openExternalInNewTab,
      }),
    );
  }, [
    compactLayout,
    layoutMode,
    darkMode,
    openExternalInNewTab,
    settingsLoaded,
  ]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  return (
    <div
      className={`min-h-screen p-6 font-sans transition-colors md:p-12 ${pageTheme}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* หัวหน้าเว็บภาพรวม */}
        <header className="mb-12 flex items-center justify-between text-left">
          <div>
            <span className="text-xs font-extrabold text-white tracking-wider bg-blue-700 px-3 py-1.5 rounded-full uppercase">
              System Control Panel
            </span>
            <h1
              className={`text-4xl font-black tracking-tight mt-3 ${cardTitle}`}
            >
              FMBD Admin Tools
            </h1>
            <p
              className={`mt-1.5 ${darkMode ? "text-slate-300" : "text-red-600"}`}
            >
              ศูนย์ควบคุมและบริหารจัดการทุกระบบงานภายในเครือข่าย
            </p>
          </div>
          <button
            type="button"
            aria-label="ตั้งค่าหน้าหลัก"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
            className={`rounded-2xl border p-3 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Settings size={22} />
          </button>
        </header>

        {settingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSettingsOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-settings-title"
              className={`w-full max-w-md rounded-xl p-5 shadow-2xl ${darkMode ? "border border-slate-700 bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`}
            >
              <div
                className={`flex items-center justify-between border-b pb-4 ${darkMode ? "border-slate-700" : "border-slate-100"}`}
              >
                <div>
                  <h2
                    id="dashboard-settings-title"
                    className={`text-lg font-bold ${cardTitle}`}
                  >
                    ตั้งค่าหน้าหลัก
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    ปรับการแสดงผลและพฤติกรรมการเปิดโมดูล
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="ปิดหน้าตั้งค่า"
                  className={`rounded-lg p-2 ${darkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 py-5">
                <fieldset>
                  <legend className={`mb-2 text-sm font-semibold ${cardTitle}`}>
                    ธีมสี
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={!darkMode}
                      onClick={() => setDarkMode(false)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        !darkMode
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      aria-pressed={darkMode}
                      onClick={() => setDarkMode(true)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        darkMode
                          ? "border-blue-400 bg-blue-950 text-blue-100"
                          : darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className={`mb-2 text-sm font-semibold ${cardTitle}`}>
                    รูปแบบการจัดวาง
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={layoutMode === "grid"}
                      onClick={() => setLayoutMode("grid")}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        layoutMode === "grid"
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      aria-pressed={layoutMode === "list"}
                      onClick={() => setLayoutMode("list")}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        layoutMode === "list"
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className={`mb-2 text-sm font-semibold ${cardTitle}`}>
                    ระยะห่างการ์ดโมดูล
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={!compactLayout}
                      onClick={() => setCompactLayout(false)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        !compactLayout
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      ปกติ
                    </button>
                    <button
                      type="button"
                      aria-pressed={compactLayout}
                      onClick={() => setCompactLayout(true)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        compactLayout
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      กะทัดรัด
                    </button>
                  </div>
                </fieldset>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${darkMode ? "border-slate-700" : "border-slate-200"}`}
                >
                  <input
                    type="checkbox"
                    checked={openExternalInNewTab}
                    onChange={(event) =>
                      setOpenExternalInNewTab(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-blue-700"
                  />
                  <span>
                    <span
                      className={`block text-sm font-semibold ${cardTitle}`}
                    >
                      เปิดแอปภายนอกในแท็บใหม่
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      ใช้กับ RVI PUSH GIRL PROJECTS
                    </span>
                  </span>
                </label>
              </div>

              <div
                className={`flex justify-end border-t pt-4 ${darkMode ? "border-slate-700" : "border-slate-100"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCompactLayout(false);
                    setLayoutMode("grid");
                    setDarkMode(false);
                    setOpenExternalInNewTab(true);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <RotateCcw size={15} /> คืนค่าเริ่มต้น
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ตารางเมนูฟังก์ชันงานของระบบ */}
        <div className="text-left">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LayoutGrid size={16} /> Available Modules & Management
          </h2>

          <div
            className={`grid ${moduleGrid} ${compactLayout ? "gap-3" : "gap-6"}`}
          >
            {/* 🔴 ปุ่มที่ 1 (ใหม่): RVI PUSH GIRL PROJECTS */}
            <a
              href="https://fmbd-push-girl-tools.vercel.app/admin"
              target={openExternalInNewTab ? "_blank" : undefined}
              rel={openExternalInNewTab ? "noopener noreferrer" : undefined}
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-rose-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-all duration-300 flex items-center justify-between ${layoutMode === "grid" ? "col-span-1 md:col-span-2" : ""} ${darkMode ? "bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800" : "bg-gradient-to-r from-white via-white to-rose-50/30"}`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 transition-transform group-hover:scale-105">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-lg font-black group-hover:text-rose-600 transition-colors ${cardTitle}`}
                    >
                      RVI PUSH GIRL PROJECTS
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                      EXTERNAL APP
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ศูนย์ควบคุมพนักงาน PG: การลงเวลา, สรุปเงินเดือน/ค่าแรงรายวัน
                    และระบบจัดการ Target รายสาขา
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-rose-500 transition-colors pl-4 flex items-center gap-1 font-bold text-xs">
                <span>เปิดแอป</span>
                <ExternalLink size={18} />
              </div>
            </a>

            {/* ปุ่มที่ 2: หน้า Create User */}
            <Link
              href="/create-user"
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300 flex items-center justify-between`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold group-hover:text-blue-600 transition-colors ${cardTitle}`}
                  >
                    Create New User
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ลงทะเบียน เพิ่มรายชื่อพนักงาน และจัดการตาราง user_profiles
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-blue-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 3: หน้า User Database & Control */}
            <Link
              href="/users"
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-300 flex items-center justify-between`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 transition-transform group-hover:scale-105">
                  <Users size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold group-hover:text-emerald-600 transition-colors ${cardTitle}`}
                  >
                    User Database & Control
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ตรวจสอบรายชื่อพนักงานทั้งหมด ค้นหา กรองตามพื้นที่
                    และสลับเปิด/ปิดสถานะ
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-emerald-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 4: หน้าเอกสารใบปะหน้าค่าใช้จ่าย (Payroll Summary) */}
            <Link
              href="/payroll"
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-orange-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-all duration-300 flex items-center justify-between`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 transition-transform group-hover:scale-105">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold group-hover:text-orange-600 transition-colors ${cardTitle}`}
                  >
                    Payroll & Expense Summary
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    จัดทำใบปะหน้าสรุปยอดค่าเดินทางพนักงานรายวัน
                    พร้อมระบบพิมพ์ออกกระดาษ
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-orange-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 5: หน้าตรวจสอบเอกสารงานและโอทีพนักงาน (Call Visit Report) */}
            <Link
              href="/report"
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-purple-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-all duration-300 flex items-center justify-between`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 transition-transform group-hover:scale-105">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold group-hover:text-purple-600 transition-colors ${cardTitle}`}
                  >
                    Call Visit & Attendance Report
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ตรวจสอบการเข้าเยี่ยมสาขา เช็คพิกัด GPS รูปถ่าย
                    และอนุมัติค่าเดินทาง/โอทีรายวัน
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-purple-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            {/* ปุ่มที่ 6: หน้าอัปโหลด Work Plan ประจำสัปดาห์ */}
            <Link
              href="/work-plan"
              className={`group ${cardPadding} ${cardSurface} rounded-3xl hover:shadow-xl hover:border-sky-400 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-all duration-300 flex items-center justify-between`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 transition-transform group-hover:scale-105">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold group-hover:text-sky-600 transition-colors ${cardTitle}`}
                  >
                    Bulk Work Plan Importer
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    อัปโหลดไฟล์แผนงานปฏิบัติงานหลักพนักงาน (.csv)
                    เพื่อกระจายข้อมูลตารางงานให้คู่ค้า
                  </p>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-sky-500 transition-colors pl-4">
                <ChevronRight size={20} />
              </div>
            </Link>

            <Link
              href="/stores"
              className={`group flex items-center justify-between rounded-3xl border ${darkMode ? "border-slate-700 bg-slate-900 shadow-black/20" : "border-slate-100 bg-white shadow-slate-200/40"} ${cardPadding} shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
            >
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 transition-transform group-hover:scale-105">
                  <Store size={24} />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold transition-colors group-hover:text-teal-700 ${cardTitle}`}
                  >
                    Store Setup
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-400">
                    เพิ่มและตรวจสอบข้อมูลร้านค้าใน pg_stores
                  </p>
                </div>
              </div>
              <div className="pl-4 text-slate-300 transition-colors group-hover:text-teal-600">
                <ChevronRight size={20} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
