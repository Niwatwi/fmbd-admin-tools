/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Printer,
  Loader2,
  AlertCircle,
  Calculator,
  Image as ImageIcon,
} from "lucide-react";

interface UserProfile {
  username: string;
  display_name: string;
  employee_id: string;
  company_tag: string;
  base_salary?: number;
  employment_type?: string; // 🟢 เพิ่มประเภทสัญญาจ้างเพื่อเก็บใน State
  image_url?: string | null; // 🟢 เพิ่มช่องรูปโปรไฟล์พนักงาน
}

interface AttendanceLog {
  id: string;
  created_at: string;
  store_name: string;
  attendance_type: string;
  travel_expense: number;
  type: "check-in" | "check-out";
  username: string;
  display_name: string;
  store_area: string;
  employee_id: string | null;
  company_tag: string;
  image_url: string | null;
}

interface LogMetadata {
  store_area: string;
  username: string;
  display_name: string;
}

export default function PayrollSummaryPage() {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [data, setData] = useState<AttendanceLog[]>([]);
  const [empInfo, setEmpInfo] = useState<UserProfile | null>(null);

  const [rawLogOptions, setRawLogOptions] = useState<LogMetadata[]>([]);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    area: "",
    empId: "",
    empName: "",
  });

  const [empType, setEmpType] = useState<"daily" | "monthly">("daily");
  const [baseWage, setBaseWage] = useState("0");
  const [kpiPay, setKpiPay] = useState("0");
  const [commissionPay, setCommissionPay] = useState("0");
  const [otherIncome, setOtherIncome] = useState("0");

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        setLoadingOptions(true);
        const { data: logs, error } = await supabase
          .from("attendance_logs")
          .select("store_area, username, display_name");

        if (error) throw error;
        if (logs) setRawLogOptions(logs as LogMetadata[]);
      } catch (err: any) {
        console.error("Failed to load filter options:", err.message);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchFilterOptions();
  }, []);

  const areaOptions = useMemo(() => {
    return Array.from(
      new Set(rawLogOptions.map((item) => item.store_area).filter(Boolean)),
    ).sort();
  }, [rawLogOptions]);

  const empIdOptions = useMemo(() => {
    let currentLogs = rawLogOptions;
    if (filters.area)
      currentLogs = currentLogs.filter(
        (item) => item.store_area === filters.area,
      );
    return Array.from(
      new Set(currentLogs.map((item) => item.username).filter(Boolean)),
    ).sort();
  }, [rawLogOptions, filters.area]);

  const empNameOptions = useMemo(() => {
    let currentLogs = rawLogOptions;
    if (filters.area)
      currentLogs = currentLogs.filter(
        (item) => item.store_area === filters.area,
      );
    if (filters.empId)
      currentLogs = currentLogs.filter(
        (item) => item.username === filters.empId,
      );
    return Array.from(
      new Set(currentLogs.map((item) => item.display_name).filter(Boolean)),
    ).sort();
  }, [rawLogOptions, filters.area, filters.empId]);

  // 🔄 2. ฟังก์ชันประมวลผลดึงประวัติงาน + ดึงค่าอัตโนมัติจากตารางหลังบ้านแบบแก้ปัญหาเรื่องช่องว่างของตัวอักษร
  const handleFetch = async () => {
    if (!filters.empId && !filters.empName) {
      alert(
        "กรุณาเลือก รหัสพนักงาน หรือ ชื่อพนักงาน จากรายการ Dropdown เพื่อประมวลผลครับ",
      );
      return;
    }

    setLoading(true);
    setEmpInfo(null);
    setData([]);

    try {
      let query = supabase
        .from("attendance_logs")
        .select(
          "id, created_at, store_name, attendance_type, travel_expense, type, username, display_name, store_area, employee_id, company_tag, image_url",
        );

      if (filters.empId) query = query.eq("username", filters.empId);
      if (filters.empName) query = query.eq("display_name", filters.empName);
      if (filters.area) query = query.eq("store_area", filters.area);
      if (filters.start)
        query = query.gte("created_at", `${filters.start}T00:00:00`);
      if (filters.end)
        query = query.lte("created_at", `${filters.end}T23:59:59`);

      const { data: logs, error: logsError } = await query.order("created_at", {
        ascending: true,
      });
      if (logsError) throw logsError;

      const typedLogs = (logs || []) as AttendanceLog[];

      if (typedLogs.length > 0) {
        setData(typedLogs);

        const logUsername = filters.empId || typedLogs[0].username;

        // 🟢 ✨ เจาะลึกค้นหาประวัติพนักงานโดยใช้ Username หลัก เพื่อหนีปัญหาเว้นวรรคชื่อไม่ตรงกัน
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select(
            "username, display_name, employee_id, company_tag, base_salary, employment_type, image_url",
          )
          .eq("username", logUsername)
          .maybeSingle();

        if (profile) {
          setEmpInfo({
            username: profile.username,
            display_name: profile.display_name || typedLogs[0].display_name,
            employee_id: profile.employee_id || "-",
            company_tag: profile.company_tag || "-",
            base_salary: profile.base_salary,
            employment_type: profile.employment_type || "รายวัน",
            image_url: profile.image_url,
          });

          // 🟢 สั่งอัปเดตช่องสีเขียวทันที
          const salaryVal =
            profile.base_salary !== undefined && profile.base_salary !== null
              ? String(profile.base_salary)
              : "0";
          setBaseWage(salaryVal);

          // 🟢 สั่งเลือกประเภทสัญญาอัตโนมัติ
          const dbEmpType = profile.employment_type
            ? String(profile.employment_type).toLowerCase()
            : "";
          if (dbEmpType.includes("month") || dbEmpType.includes("เดือน")) {
            setEmpType("monthly");
          } else {
            setEmpType("daily");
          }
        } else {
          // Fallback กรณีตารางพนักงานไม่มีข้อมูล
          setEmpInfo({
            username: typedLogs[0].username,
            display_name: typedLogs[0].display_name || "ไม่ระบุชื่อพนักงาน",
            employee_id: typedLogs[0].employee_id || typedLogs[0].username,
            company_tag: typedLogs[0].company_tag || "STAFF",
            base_salary: 0,
            employment_type: "รายวัน",
            image_url: null,
          });
          setBaseWage("0");
          setEmpType("daily");
        }
      } else {
        alert("ไม่พบข้อมูลประวัติการทำงานและค่าเดินทางในช่วงเวลาดังกล่าวครับ");
      }
    } catch (err: any) {
      console.error("Payroll querying error:", err.message);
      alert("เกิดข้อผิดพลาดในการดึงประวัติบัญชี");
    } finally {
      setLoading(false);
    }
  };

  const hrSummary = useMemo(() => {
    const dayMap: { [date: string]: { type: string; logs: AttendanceLog[] } } =
      {};

    data.forEach((log) => {
      const dateStr = log.created_at.split("T")[0];
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { type: "ปกติ", logs: [] };
      }
      dayMap[dateStr].logs.push(log);

      const attType = log.attendance_type || "";
      if (attType.includes("วันหยุด") && !attType.includes("นักขัต"))
        dayMap[dateStr].type = "วันหยุด";
      else if (attType.includes("นักขัตฤกษ์") && attType.includes("วันหยุด"))
        dayMap[dateStr].type = "วันหยุดนักขัตฤกษ์";
      else if (attType.includes("นักขัตฤกษ์"))
        dayMap[dateStr].type = "วันนักขัตฤกษ์";
      else if (attType.includes("วันลากิจ")) dayMap[dateStr].type = "วันลากิจ";
      else if (
        attType.includes("วันลาป่วยมีใบรับรองแพทย์") ||
        (attType.includes("ลาป่วย") &&
          (attType.includes("มีใบ") || attType.includes("แพทย์")))
      )
        dayMap[dateStr].type = "วันลาป่วยมีใบรับรอง";
      else if (
        attType.includes("วันลาป่วยไม่มีใบรับรองแพทย์") ||
        attType.includes("ลาป่วย")
      )
        dayMap[dateStr].type = "วันลาป่วยไม่มีใบรับรอง";
    });

    let normalWorkdays = 0;
    let restDays = 0;
    let publicHolidays = 0;
    let paidPublicHolidays = 0;
    let businessLeaves = 0;
    let sickLeavesCert = 0;
    let sickLeavesNoCert = 0;
    let totalOTHours = 0;

    Object.keys(dayMap).forEach((dateStr) => {
      const day = dayMap[dateStr];
      const checkIns = day.logs
        .filter((l) => l.type === "check-in")
        .map((l) => new Date(l.created_at).getTime());
      const checkOuts = day.logs
        .filter((l) => l.type === "check-out")
        .map((l) => new Date(l.created_at).getTime());

      if (checkIns.length > 0 && checkOuts.length > 0) {
        const firstIn = Math.min(...checkIns);
        const lastOut = Math.max(...checkOuts);
        const totalHours = (lastOut - firstIn) / (1000 * 60 * 60);
        if (totalHours > 9) {
          totalOTHours += Math.floor(totalHours - 9);
        }
      }

      if (day.type === "วันหยุด") restDays++;
      else if (day.type === "วันนักขัตฤกษ์") publicHolidays++;
      else if (day.type === "วันหยุดนักขัตฤกษ์") paidPublicHolidays++;
      else if (day.type === "วันลากิจ") businessLeaves++;
      else if (day.type === "วันลาป่วยมีใบรับรอง") sickLeavesCert++;
      else if (day.type === "วันลาป่วยไม่มีใบรับรอง") sickLeavesNoCert++;
      else normalWorkdays++;
    });

    const totalCountedDays = normalWorkdays + publicHolidays + sickLeavesCert;

    return {
      normalWorkdays,
      restDays,
      publicHolidays,
      paidPublicHolidays,
      businessLeaves,
      sickLeavesCert,
      sickLeavesNoCert,
      totalOTHours,
      totalCountedDays,
    };
  }, [data]);

  const totalTravelExpense = useMemo(() => {
    return data.reduce(
      (sum, item) => sum + (Number(item.travel_expense) || 0),
      0,
    );
  }, [data]);

  const financialCalculations = useMemo(() => {
    const wageInput = parseFloat(baseWage) || 0;
    const kpi = parseFloat(kpiPay) || 0;
    const comm = parseFloat(commissionPay) || 0;
    const other = parseFloat(otherIncome) || 0;

    let hourlyOTRate = 0;
    if (empType === "daily") {
      hourlyOTRate = (wageInput / 8) * 1.5;
    } else {
      hourlyOTRate = (wageInput / 26 / 8) * 1.5;
    }
    const totalOTPay = hrSummary.totalOTHours * hourlyOTRate;

    const effectiveDailyWage = empType === "daily" ? wageInput : wageInput / 26;
    const calculatedBaseSalary =
      hrSummary.totalCountedDays * effectiveDailyWage;
    const netIncome =
      calculatedBaseSalary +
      totalOTPay +
      totalTravelExpense +
      kpi +
      comm +
      other;

    return { totalOTPay, calculatedBaseSalary, netIncome };
  }, [
    hrSummary,
    baseWage,
    empType,
    kpiPay,
    commissionPay,
    otherIncome,
    totalTravelExpense,
  ]);

  const displayArea = useMemo(() => {
    if (filters.area) return filters.area;
    if (data.length > 0) return data[0].store_area;
    return "-";
  }, [data, filters.area]);

  const autoTransactionDate = useMemo(() => {
    return new Date().toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [data]);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen print:bg-white print:p-0 text-slate-800 text-left">
      {/* ตัวกรอง (ซ่อนตอนพิมพ์) */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 print:hidden border border-slate-200 max-w-6xl mx-auto space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <AlertCircle size={16} className="text-blue-600" />{" "}
          ระบบจัดทำใบปะหน้าและคำนวณฐานเงินเดือนพนักงานสรุปผล
        </h3>

        {loadingOptions ? (
          <div className="text-xs text-slate-500 flex items-center gap-2 animate-pulse">
            <Loader2 size={14} className="animate-spin text-blue-600" />{" "}
            กำลังเตรียมรายชื่อพนักงาน...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs font-semibold">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">📅 วันเริ่มต้น</span>
              <input
                type="date"
                className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 outline-none"
                onChange={(e) =>
                  setFilters({ ...filters, start: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">📅 วันสิ้นสุด</span>
              <input
                type="date"
                className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 outline-none"
                onChange={(e) =>
                  setFilters({ ...filters, end: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">📍 เขตพื้นที่ (Area)</span>
              <select
                value={filters.area}
                className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 outline-none text-slate-700"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    area: e.target.value,
                    empId: "",
                    empName: "",
                  })
                }
              >
                <option value="">-- ทั้งหมด --</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    เขต {area}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">🆔 รหัสพนักงาน</span>
              <select
                value={filters.empId}
                className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 outline-none text-slate-700 font-mono"
                onChange={(e) =>
                  setFilters({ ...filters, empId: e.target.value, empName: "" })
                }
              >
                <option value="">-- เลือกรหัส --</option>
                {empIdOptions.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">👤 ชื่อพนักงาน</span>
              <select
                value={filters.empName}
                className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 outline-none text-slate-700"
                onChange={(e) =>
                  setFilters({ ...filters, empName: e.target.value })
                }
              >
                <option value="">-- เลือกชื่อ --</option>
                {empNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFetch}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-[38px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}{" "}
                ประมวลผลเงินเดือน
              </button>
            </div>
          </div>
        )}

        {/* แผงควบคุมตัวแปรการเงิน */}
        {empInfo && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-bold animate-fadeIn">
            <div className="flex flex-col gap-1">
              <span className="text-blue-900 flex items-center gap-1">
                <Calculator size={14} /> เงื่อนไขประเภทสัญญา
              </span>
              <select
                value={empType}
                onChange={(e) => setEmpType(e.target.value as any)}
                className="border border-slate-300 p-2 rounded-lg bg-white outline-none font-semibold"
              >
                <option value="daily">พนักงานรายวัน (Daily)</option>
                <option value="monthly">พนักงานรายเดือน (Monthly)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-emerald-700">
                💰 ฐานค่าแรง (ดึงอัตโนมัติ)
              </span>
              <input
                type="number"
                min="0"
                value={baseWage}
                onChange={(e) => setBaseWage(e.target.value)}
                className="border border-emerald-400 p-2 rounded-lg bg-white outline-none text-right font-mono font-bold text-emerald-800"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-600">🎯 ค่า KPI Bonus</span>
              <input
                type="number"
                min="0"
                value={kpiPay}
                onChange={(e) => setKpiPay(e.target.value)}
                className="border border-slate-300 p-2 rounded-lg bg-white outline-none text-right font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-600">📈 ค่า Commission</span>
              <input
                type="number"
                min="0"
                value={commissionPay}
                onChange={(e) => setCommissionPay(e.target.value)}
                className="border border-slate-300 p-2 rounded-lg bg-white outline-none text-right font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-600">📦 รายได้อื่น ๆ รวม</span>
              <input
                type="number"
                min="0"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                className="border border-slate-300 p-2 rounded-lg bg-white outline-none text-right font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* เอกสารสรุปใบปะหน้าจริงสำหรับฝ่ายบัญชี / HR */}
      {empInfo && (
        <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-md print:shadow-none print:p-0 animate-fadeIn">
          <div className="flex items-center justify-between mb-6 border-b-2 border-slate-900 pb-4">
            {/* ฝั่งซ้าย: โลโก้และชื่อบริษัท */}
            <div className="flex items-center gap-4">
              <img
                src="/rvp.png"
                alt="Riverpro Logo"
                className="w-16 h-auto object-contain"
              />
              <div>
                <h1 className="font-bold text-xl tracking-tight text-slate-950">
                  บริษัท ริเวอร์โปร อินเตอร์เทรด จำกัด
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Field Marketing & Business Development Department
                </p>
              </div>
            </div>

            {/* 🟢 ✨ ฝั่งขวา: ปรับผูกตัวแปรเข้ากับ empInfo โดยตรงเพื่อให้ดึงรูปพนักงานและข้อมูลขึ้นอัตโนมัติ ไม่ใช้ตัวแปรอื่นที่ไม่มีอยู่จริง */}
            <div className="flex items-center gap-3 text-right">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-950">
                  {empInfo.display_name}
                </span>
                <span className="text-[10px] text-slate-500 font-bold font-mono">
                  ID: {empInfo.employee_id} | {empInfo.company_tag}
                </span>
              </div>
              <div className="w-11 h-11 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
                {empInfo.image_url && empInfo.image_url.startsWith("http") ? (
                  <img
                    src={empInfo.image_url}
                    alt="User Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <h2 className="text-center font-bold text-base mb-6 text-slate-950 underline underline-offset-4 uppercase tracking-wide">
            เอกสารใบปะหน้าสรุปผลปฏิบัติงานและค่าใช้จ่ายรายบุคคล
          </h2>

          {/* รายละเอียดพนักงาน */}
          <div className="grid grid-cols-2 gap-y-2 text-xs mb-6 border border-slate-300 p-4 rounded-xl bg-slate-50 font-medium">
            <p>
              ชื่อ-นามสกุลพนักงาน:{" "}
              <b className="text-slate-950 font-bold ml-1">
                {empInfo.display_name}
              </b>
            </p>
            <p>
              รหัสพนักงาน:{" "}
              <b className="text-slate-950 font-mono font-bold ml-1">
                {empInfo.employee_id}
              </b>
            </p>
            <p>
              เขตปฏิบัติงาน (Area):{" "}
              <b className="text-slate-950 font-bold ml-1">{displayArea}</b>
            </p>
            <p>
              ตำแหน่ง (Role):{" "}
              <b className="text-slate-950 font-bold ml-1">
                {empInfo.company_tag}
              </b>
            </p>
            <p className="col-span-2">
              ประเภทสัญญาจ้าง:{" "}
              <b className="text-slate-950 font-bold ml-1">
                {empInfo.employment_type ||
                  (empType === "daily" ? "รายวัน" : "รายเดือน")}
              </b>
            </p>
          </div>

          {/* ตารางสรุปยอดวันทำงาน รายได้ และรายการลา */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1">
              📊 ตารางสรุปยอดวันทำงาน รายได้ และรายการลา
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-xs text-slate-900">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-400 p-2 text-left w-1/2">
                    หัวข้อสรุปการปฏิบัติงาน / รายการลา
                  </th>
                  <th className="border border-slate-400 p-2 text-center w-1/4">
                    จำนวนสุทธิ
                  </th>
                  <th className="border border-slate-400 p-2 text-right w-1/4">
                    คิดเป็นเงิน (บาท)
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium">
                <tr className="bg-slate-50/60 font-semibold">
                  <td className="border border-slate-400 p-2 text-slate-700">
                    💰 อัตราค่าแรงฐานประเมินผล (จากทะเบียนประวัติ)
                  </td>
                  <td className="border border-slate-400 p-2 text-center text-slate-600">
                    {empType === "daily" ? "รายวัน" : "รายเดือน"}
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-slate-900">
                    {(parseFloat(baseWage) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    📅 จำนวนวันทำงานปกติ (Normal Workdays)
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.normalWorkdays} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🌴 จำนวนยอดรวมวันหยุดประจำสัปดาห์ / รอบวิ่ง
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.restDays} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🏛️ จำนวนยอดรวมวันนักขัตฤกษ์
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.publicHolidays} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    💮 จำนวนยอดรวมวันหยุดนักขัตฤกษ์
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.paidPublicHolidays} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🚶‍♂️ จำนวนยอดรวมวันลากิจ
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.businessLeaves} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🏥 จำนวนยอดรวมวันลาป่วย (มีใบรับรองแพทย์)
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.sickLeavesCert} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🤒 จำนวนยอดรวมวันลาป่วย (ไม่มีใบรับรองแพทย์)
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.sickLeavesNoCert} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right text-slate-400 font-mono">
                    -
                  </td>
                </tr>
                <tr className="bg-blue-50/40 font-bold">
                  <td className="border border-slate-400 p-2 text-blue-950">
                    📋 ยอดรวมวันทำงานทั้งหมด (คิดฐานค่าแรงหลัก)
                  </td>
                  <td className="border border-slate-400 p-2 text-center text-blue-950 font-mono">
                    {hrSummary.totalCountedDays} วัน
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-blue-900">
                    {financialCalculations.calculatedBaseSalary.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    ⏰ ยอดรวมชั่วโมงโอที (OT Hours Floor)
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    {hrSummary.totalOTHours} ชม.
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono text-orange-700">
                    {financialCalculations.totalOTPay.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🚗 ยอดรวมค่าเดินทางรวมรอบสาขา
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    -
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {totalTravelExpense.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    🎯 ยอดรวมค่า KPI Bonus ( KOE Approved )
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    -
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {(parseFloat(kpiPay) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    📈 ยอดรวมค่า Commission
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    -
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {(parseFloat(commissionPay) || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    📦 ยอดรวมรายได้อื่นๆ (ค่าส่งไปรษณีย์, ค่าทางด่วน, ค่าเรือ,
                    ค่าเครื่องบิน, ค่าที่จอดรถ)
                  </td>
                  <td className="border border-slate-400 p-2 text-center font-mono">
                    -
                  </td>
                  <td className="border border-slate-400 p-2 text-right font-mono">
                    {(parseFloat(otherIncome) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr className="bg-emerald-50 font-black text-slate-950 text-xs">
                  <td
                    colSpan={2}
                    className="border border-slate-400 p-3 text-right text-emerald-950"
                  >
                    💵 รวมยอดเงินรายได้สุทธิทั้งสิ้น (Net Income Pay):
                  </td>
                  <td className="border border-slate-400 p-3 text-right font-mono text-emerald-700 bg-emerald-100/50 text-sm">
                    {financialCalculations.netIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* รายละเอียดแผ่นบันทึกงานแยกรายสาขาจริง */}
          <h3 className="text-xs font-black text-slate-900 mb-2">
            📋 รายละเอียดประวัติล็อกเวลาเข้าเยี่ยมสาขาจริง
          </h3>
          <table className="w-full border-collapse border border-slate-400 text-[10px] text-slate-900">
            <thead>
              <tr className="bg-slate-50 text-slate-800 font-bold">
                <th className="border border-slate-400 p-1.5 text-center w-16">
                  วันที่
                </th>
                <th className="border border-slate-400 p-1.5 text-left">
                  ชื่อร้านค้า / สถานที่ปฏิบัติงาน
                </th>
                <th className="border border-slate-400 p-1.5 text-center w-24">
                  ประเภท/หมายเหตุงาน
                </th>
                <th className="border border-slate-400 p-1.5 text-center w-16">
                  รูปหลักฐาน
                </th>
                <th className="border border-slate-400 p-1.5 text-center w-16">
                  เวลาบันทึก
                </th>
                <th className="border border-slate-400 p-1.5 text-center w-14">
                  สถานะ
                </th>
                <th className="border border-slate-400 p-1.5 text-right w-16">
                  ค่าเดินทาง
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-50/50">
                  <td className="border border-slate-400 p-1.5 text-center font-mono">
                    {new Date(row.created_at).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border border-slate-400 p-1.5 font-medium">
                    {row.store_name}
                  </td>
                  <td className="border border-slate-400 p-1.5 text-slate-600 text-center">
                    {row.attendance_type || "ปกติ"}
                  </td>
                  <td className="border border-slate-400 p-1 text-center">
                    {row.image_url ? (
                      <a
                        href={row.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block group"
                      >
                        <img
                          src={row.image_url}
                          alt="Visit Snap"
                          className="w-8 h-8 rounded border object-cover mx-auto group-hover:scale-105 transition-all shadow-sm"
                        />
                      </a>
                    ) : (
                      <span className="text-slate-300 italic text-[9px]">
                        ไม่มีรูป
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-400 p-1.5 text-center font-mono">
                    {new Date(row.created_at).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    น.
                  </td>
                  <td className="border border-slate-400 p-1.5 text-center font-bold">
                    <span
                      className={
                        row.type === "check-in"
                          ? "text-blue-600"
                          : "text-emerald-600"
                      }
                    >
                      {row.type === "check-in" ? "เข้างาน" : "ออกงาน"}
                    </span>
                  </td>
                  <td className="border border-slate-400 p-1.5 text-right font-mono">
                    {(Number(row.travel_expense) || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* โซนลายเซ็นท้ายเล่ม */}
          <div className="grid grid-cols-3 gap-10 mt-16 text-center text-xs font-bold text-slate-800">
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-dashed border-slate-400 h-6 mb-2"></div>
              <span>
                (......................................................)
              </span>
              <span className="mt-1 text-slate-500 font-medium">
                พนักงานผู้ขอเบิก
              </span>
              <span className="text-[10px] text-slate-400 mt-2 font-mono font-normal">
                วันที่ทำรายการ: {autoTransactionDate}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-dashed border-slate-400 h-6 mb-2"></div>
              <span>
                (......................................................)
              </span>
              <span className="mt-1 text-slate-500 font-medium">
                ผู้ตรวจสอบ (KOE)
              </span>
              <span className="text-[10px] text-slate-400 mt-2 font-mono font-normal">
                วันที่ทำรายการ: {autoTransactionDate}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-dashed border-slate-400 h-6 mb-2"></div>
              <span>
                (......................................................)
              </span>
              <span className="mt-1 text-slate-500 font-medium">
                ผู้อนุมัติ (Manager)
              </span>
              <span className="text-[10px] text-slate-400 mt-2 font-mono font-normal">
                วันที่ทำรายการ: {autoTransactionDate}
              </span>
            </div>
          </div>

          <div className="mt-12 flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 px-6 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> สั่งพิมพ์ใบปะหน้าสรุปยอด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
