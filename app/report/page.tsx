/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import {
  Calendar,
  User,
  Clock,
  DollarSign,
  Search,
  Download,
  RefreshCw,
  MapPin,
  Save,
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
} from "lucide-react";

interface ReportData {
  username: string;
  display_name: string;
  company_tag: string;
  work_date: string;
  store_id: number;
  store_code: string;
  store_name: string;
  store_area: string;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | null;
  check_in_image: string | null;
  check_out_image: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  travel_expense: number | null;
  // 🟢 ✨ เพิ่มฟิลด์รองรับประเภทการเข้างานและบันทึกโน้ตพิเศษจากหน้างาน
  attendance_type: string | null;
  note: string | null;
}

interface LogMetadata {
  store_area: string;
  username: string;
  display_name: string;
}

export default function AdminReportPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [issavingExpense, setIsSavingExpense] = useState<string | null>(null);
  const [expenseInputs, setExpenseInputs] = useState<{ [key: string]: string }>(
    {},
  );

  // สเตทระบบจัดการช่วงเวลาและรอบตัดจ่าย
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cyclePreset, setCyclePreset] = useState("");
  const [baseMonth, setBaseMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  // สเตทระบบเมนู Dropdown สัมพันธ์ต่อเนื่องกัน
  const [rawLogOptions, setRawLogOptions] = useState<LogMetadata[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedEmpName, setSelectedEmpName] = useState("");

  // ดึงเมทาดาตารายชื่อทั้งหมดจากดาต้าเบสรอบเดียวเพื่อจ่ายเข้า Dropdown
  useEffect(() => {
    async function initFilterOptions() {
      try {
        setLoadingOptions(true);
        const { data: logs, error } = await supabase
          .from("attendance_logs")
          .select("store_area, username, display_name");

        if (error) throw error;
        if (logs) setRawLogOptions(logs as LogMetadata[]);
      } catch (err: any) {
        console.error("Failed to load options database:", err.message);
      } finally {
        setLoadingOptions(false);
      }
    }
    initFilterOptions();
    fetchReportData("", "");
  }, []);

  // คำนวณตัวเลือก "เขตพื้นที่ (Area)" ทั้งหมด
  const areaOptions = useMemo(() => {
    return Array.from(
      new Set(rawLogOptions.map((i) => i.store_area).filter(Boolean)),
    ).sort();
  }, [rawLogOptions]);

  // คำนวณตัวเลือก "รหัสพนักงาน" ปรับตัวตามเขตพื้นที่
  const empIdOptions = useMemo(() => {
    let current = rawLogOptions;
    if (selectedArea)
      current = current.filter((i) => i.store_area === selectedArea);
    return Array.from(
      new Set(current.map((i) => i.username).filter(Boolean)),
    ).sort();
  }, [rawLogOptions, selectedArea]);

  // คำนวณตัวเลือก "ชื่อพนักงาน" ปรับตามตัวเลือก Area และรหัสพนักงานเป๊ะๆ
  const empNameOptions = useMemo(() => {
    let current = rawLogOptions;
    if (selectedArea)
      current = current.filter((i) => i.store_area === selectedArea);
    if (selectedEmpId)
      current = current.filter((i) => i.username === selectedEmpId);
    return Array.from(
      new Set(current.map((i) => i.display_name).filter(Boolean)),
    ).sort();
  }, [rawLogOptions, selectedArea, selectedEmpId]);

  // คำนวณรอบตัดจ่ายอัตโนมัติประจำเดือน
  useEffect(() => {
    if (!cyclePreset) return;

    const [year, month] = baseMonth.split("-").map(Number);
    const formatDigit = (num: number) => num.toString().padStart(2, "0");

    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    let computedStart = "";
    let computedEnd = "";

    if (cyclePreset === "KOE") {
      computedStart = `${year}-${formatDigit(month)}-21`;
      computedEnd = `${nextYear}-${formatDigit(nextMonth)}-20`;
    } else if (cyclePreset === "MER") {
      computedStart = `${year}-${formatDigit(month)}-16`;
      computedEnd = `${nextYear}-${formatDigit(nextMonth)}-15`;
    }

    setStartDate(computedStart);
    setEndDate(computedEnd);
    fetchReportData(computedStart, computedEnd);
  }, [cyclePreset, baseMonth]);

  // รันดึงข้อมูลอัตโนมัติเมื่อหัวหน้าเปลี่ยนช่วงวันที่ทำงานในโหมดกำหนดเอง
  useEffect(() => {
    if (cyclePreset === "" && (startDate || endDate)) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const fetchReportData = async (
    overrideStart?: string,
    overrideEnd?: string,
  ) => {
    try {
      setIsLoading(true);
      let query = supabase.from("employee_expense_report").select("*");

      const finalStart =
        overrideStart !== undefined ? overrideStart : startDate;
      const finalEnd = overrideEnd !== undefined ? overrideEnd : endDate;

      if (finalStart) query = query.gte("work_date", finalStart);
      if (finalEnd) query = query.lte("work_date", finalEnd);

      if (selectedArea) query = query.eq("store_area", selectedArea);
      if (selectedEmpId) query = query.eq("username", selectedEmpId);
      if (selectedEmpName) query = query.eq("display_name", selectedEmpName);

      const { data, error } = await query.order("display_name", {
        ascending: true,
      });
      if (error) throw error;

      const typedData = (data || []) as ReportData[];
      setReports(typedData);

      const inputs: { [key: string]: string } = {};
      typedData.forEach((r) => {
        const key = `${r.username}_${r.store_id}_${r.work_date}`;
        inputs[key] = r.travel_expense?.toString() || "0";
      });
      setExpenseInputs(inputs);
    } catch (err: any) {
      console.error("Error fetching report data:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // คำนวณโอที (OT) สรุปยอดรวมรายวันเศษนาทีปัดทิ้ง
  const userDailyOTMap = useMemo(() => {
    const map: {
      [key: string]: {
        firstIn: string | null;
        lastOut: string | null;
        ot: number;
      };
    } = {};

    reports.forEach((r) => {
      const dayKey = `${r.username}_${r.work_date}`;
      if (!map[dayKey]) {
        map[dayKey] = {
          firstIn: r.check_in_time,
          lastOut: r.check_out_time,
          ot: 0,
        };
      } else {
        if (
          r.check_in_time &&
          (!map[dayKey].firstIn ||
            new Date(r.check_in_time) < new Date(map[dayKey].firstIn!))
        ) {
          map[dayKey].firstIn = r.check_in_time;
        }
        if (
          r.check_out_time &&
          (!map[dayKey].lastOut ||
            new Date(r.check_out_time) > new Date(map[dayKey].lastOut!))
        ) {
          map[dayKey].lastOut = r.check_out_time;
        }
      }
    });

    Object.keys(map).forEach((dayKey) => {
      const { firstIn, lastOut } = map[dayKey];
      if (firstIn && lastOut) {
        const diffMs =
          new Date(lastOut).getTime() - new Date(firstIn).getTime();
        const totalHours = diffMs / (1000 * 60 * 60);
        if (totalHours > 9) {
          map[dayKey].ot = Math.floor(totalHours - 9);
        } else {
          map[dayKey].ot = 0;
        }
      }
    });

    return map;
  }, [reports]);

  const handleUpdateExpense = async (
    username: string,
    storeId: number,
    workDate: string,
  ) => {
    const key = `${username}_${storeId}_${workDate}`;
    const amount = parseFloat(expenseInputs[key] || "0");

    if (isNaN(amount) || amount < 0) {
      return Swal.fire({
        icon: "warning",
        title: "กรุณากรอกจำนวนเงินให้ถูกต้อง",
      });
    }

    try {
      setIsSavingExpense(key);
      const { error } = await supabase
        .from("attendance_logs")
        .update({ travel_expense: amount })
        .eq("username", username)
        .eq("store_id", storeId)
        .gte("created_at", `${workDate}T00:00:00`)
        .lte("created_at", `${workDate}T23:59:59`);

      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "บันทึกค่าเดินทางสำเร็จ",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: err.message });
    } finally {
      setIsSavingExpense(null);
    }
  };

  // 🟢 ✨ ปรับปรุงโครงสร้างไฟล์รายงานดาวน์โหลด CSV ให้มีข้อมูลแจกแจงประเภทงานและโน้ตกำกับ
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      "วันที่,รหัสพนักงาน,ชื่อพนักงาน,รหัสร้าน,ชื่อร้านค้า,ประเภทการเข้างาน,หมายเหตุหน้างาน,เวลาเข้า,เวลาออก,ชั่วโมงทำงาน(Callนี้),โอทีรวมของวัน(ชม.),ค่าเดินทาง(KOE)\n",
    ];
    const rows = reports.map((r) => {
      const key = `${r.username}_${r.store_id}_${r.work_date}`;
      const dayKey = `${r.username}_${r.work_date}`;
      const expense = expenseInputs[key] || "0";
      const otHours = userDailyOTMap[dayKey]?.ot || 0;

      const typeStr = r.attendance_type || "ปกติ";
      const noteStr = r.note ? r.note.replace(/"/g, '""') : "-";

      return `"${r.work_date}","${r.username}","${r.display_name}","${r.store_code}","${r.store_name}","${typeStr}","${noteStr}","${r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("th-TH") : "-"}","${r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("th-TH") : "-"}","${r.work_hours || 0}","${otHours}","${expense}"`;
    });

    const csvContent = "\uFEFF" + headers + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CallVisit_Detailed_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-800 text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-800">
              Call Visit Documents & Attendance Summary
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              เอกสารตรวจสอบการเข้าเยี่ยมสาขา และอนุมัติค่าเดินทางโดยหัวหน้า
              (KOE)
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => fetchReportData()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={reports.length === 0}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* ตัวกรอง */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> 1.
                เลือกเดือนประมวลผล
              </label>
              <input
                type="month"
                value={baseMonth}
                onChange={(e) => setBaseMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 flex items-center gap-1">
                💼 2. รอบตัดจ่ายด่วนรายกลุ่ม
              </label>
              <select
                value={cyclePreset}
                onChange={(e) => setCyclePreset(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">-- กำหนดช่วงเวลาเอง (Manual) --</option>
                <option value="KOE">รอบ KOE (วันที่ 21 - 20)</option>
                <option value="MER">
                  รอบ MER, COMMANDO, BA (วันที่ 16 - 15)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />{" "}
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCyclePreset("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />{" "}
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCyclePreset("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loadingOptions ? (
            <div className="text-[10px] text-slate-400 animate-pulse bg-slate-50 p-2 rounded-lg">
              กำลังจัดเตรียมรายชื่อและเขตพื้นที่สำหรับเมนู Dropdown...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  📍 เขตพื้นที่ (Area)
                </span>
                <select
                  value={selectedArea}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedEmpId("");
                    setSelectedEmpName("");
                  }}
                >
                  <option value="">-- ทั้งหมดทุกเขต --</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      เขต {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  🆔 รหัสพนักงาน
                </span>
                <select
                  value={selectedEmpId}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-700 outline-none focus:border-blue-500"
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    setSelectedEmpName("");
                  }}
                >
                  <option value="">-- เลือกรหัสพนักงาน --</option>
                  {empIdOptions.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  👤 ชื่อพนักงาน (ปรับตามตัวเลือก)
                </span>
                <select
                  value={selectedEmpName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  onChange={(e) => setSelectedEmpName(e.target.value)}
                >
                  <option value="">-- เลือกรายชื่อพนักงาน --</option>
                  {empNameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => fetchReportData()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[38px] rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" /> ค้นหาและกรองข้อมูล
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">ข้อมูลพนักงาน / ร้านค้า</th>
                  <th className="p-4 border-l border-slate-100">
                    เวลาปฏิบัติงาน
                  </th>
                  <th className="p-4 text-center border-l border-slate-100 w-32">
                    โอทีรวม (OT)
                  </th>
                  <th className="p-4 text-center border-l border-slate-100">
                    หลักฐานรูปถ่าย (Call Visit)
                  </th>
                  <th className="p-4 text-center border-l border-slate-100">
                    พิกัดดาวเทียม (GPS)
                  </th>
                  <th
                    className="p-4 text-right border-l border-slate-100"
                    style={{ width: "200px" }}
                  >
                    <DollarSign className="w-3.5 h-3.5 inline" /> ค่าเดินทาง
                    (KOE)
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400 font-bold italic"
                    >
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                      กำลังดึงและคัดกรองข้อมูล Call Visit ตามช่วงเวลาที่ระบุ...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400 font-bold italic"
                    >
                      📭 ไม่พบข้อมูลการเข้าเยี่ยมสาขา (Call Visit)
                      ในช่วงวันที่เลือก
                    </td>
                  </tr>
                ) : (
                  reports.map((report, idx) => {
                    const inputKey = `${report.username}_${report.store_id}_${report.work_date}`;
                    const dayKey = `${report.username}_${report.work_date}`;
                    const dailyOT = userDailyOTMap[dayKey]?.ot || 0;

                    // ตรวจเช็คสถานะงานกลางคืน/งานพิเศษเพื่อเปลี่ยนสี Badge
                    const isSpecialTask =
                      report.attendance_type &&
                      !report.attendance_type.includes("ปกติ") &&
                      !report.attendance_type.toLowerCase().includes("normal");

                    return (
                      <tr
                        key={`${inputKey}_${idx}`}
                        className="hover:bg-slate-50/40 transition-all"
                      >
                        <td className="p-4">
                          <p className="font-bold text-slate-900 text-[13px]">
                            {report.display_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold">
                            {report.username} | {report.company_tag} |{" "}
                            {report.work_date}
                          </p>

                          <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 inline-block w-full max-w-sm">
                            <p className="font-black text-blue-950 text-[11px]">
                              {report.store_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono font-semibold">
                              Code: {report.store_code} | Area:{" "}
                              {report.store_area}
                            </p>

                            {/* 🟢 ✨ แสดงแถบประเภทงาน และกล่องโน้ตหมายเหตุเพิ่มเติมใต้ข้อมูลร้าน */}
                            {(report.attendance_type || report.note) && (
                              <div className="mt-2 pt-2 border-t border-slate-200/70 flex flex-col gap-1.5">
                                {report.attendance_type && (
                                  <span
                                    className={`inline-flex items-center w-max text-[9px] font-black px-2 py-0.5 rounded-md ${
                                      isSpecialTask
                                        ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                    }`}
                                  >
                                    {isSpecialTask
                                      ? "🌙 งานพิเศษ: "
                                      : "📋 ประเภท: "}{" "}
                                    {report.attendance_type}
                                  </span>
                                )}
                                {report.note && (
                                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg font-sans font-medium leading-relaxed">
                                    <span className="font-bold">
                                      📝 บันทึก:
                                    </span>{" "}
                                    {report.note}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 space-y-1.5 border-l border-slate-50">
                          <p className="text-blue-600 font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                            In:{" "}
                            {report.check_in_time
                              ? new Date(
                                  report.check_in_time,
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " น."
                              : "-"}
                          </p>
                          <p className="text-emerald-600 font-mono font-bold text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            Out:{" "}
                            {report.check_out_time
                              ? new Date(
                                  report.check_out_time,
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " น."
                              : "-"}
                          </p>
                          <p className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-black inline-block font-mono border border-slate-200">
                            Call นี้: {report.work_hours || 0} ชม.
                          </p>
                        </td>

                        <td className="p-4 text-center border-l border-slate-50 font-mono font-bold">
                          {dailyOT > 0 ? (
                            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 shadow-sm text-xs">
                              {dailyOT} ชม.
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">
                              -
                            </span>
                          )}
                          <p className="text-[9px] text-slate-400 font-sans font-normal mt-1.5 tracking-tight">
                            (สรุปยอดรายวัน)
                          </p>
                        </td>

                        <td className="p-4 text-center border-l border-slate-50">
                          <div className="flex justify-center items-center gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 font-black mb-1">
                                รูปเข้างาน
                              </span>
                              {report.check_in_image ? (
                                <a
                                  href={report.check_in_image}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block group"
                                >
                                  <img
                                    src={report.check_in_image}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 group-hover:scale-105 transition-all shadow-sm"
                                    alt="Check In"
                                  />
                                </a>
                              ) : (
                                <span className="text-slate-300 text-[10px] italic">
                                  ไม่มีรูป
                                </span>
                              )}
                            </div>
                            <div className="border-r border-slate-200 h-8"></div>
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 font-black mb-1">
                                รูปออกงาน
                              </span>
                              {report.check_out_image ? (
                                <a
                                  href={report.check_out_image}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block group"
                                >
                                  <img
                                    src={report.check_out_image}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 group-hover:scale-105 transition-all shadow-sm"
                                    alt="Check Out"
                                  />
                                </a>
                              ) : (
                                <span className="text-slate-300 text-[10px] italic">
                                  ไม่มีรูป
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center space-y-1.5 border-l border-slate-50">
                          {report.check_in_lat && report.check_in_lng ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${report.check_in_lat},${report.check_in_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-black px-2 py-1 rounded-lg hover:bg-blue-100 transition-all font-mono border border-blue-200/60"
                            >
                              <MapPin className="w-3 h-3 text-blue-500" /> GPS
                              In
                            </a>
                          ) : (
                            <span className="text-slate-300 text-[10px] block italic">
                              ไม่มีพิกัดเข้า
                            </span>
                          )}

                          {report.check_out_lat && report.check_out_lng ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${report.check_out_lat},${report.check_out_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-1 rounded-lg hover:bg-emerald-100 transition-all font-mono border border-emerald-200/60"
                            >
                              <MapPin className="w-3 h-3 text-emerald-500" />{" "}
                              GPS Out
                            </a>
                          ) : report.check_in_lat ? (
                            <span className="text-slate-300 text-[10px] block italic">
                              ไม่มีพิกัดออก
                            </span>
                          ) : null}
                        </td>

                        <td className="p-4 text-right border-l border-slate-50">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-400 font-black text-xs">
                              ฿
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={expenseInputs[inputKey] || ""}
                              onChange={(e) =>
                                setExpenseInputs({
                                  ...expenseInputs,
                                  [inputKey]: e.target.value,
                                })
                              }
                              className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-right font-black text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                            <button
                              onClick={() =>
                                handleUpdateExpense(
                                  report.username,
                                  report.store_id,
                                  report.work_date,
                                )
                              }
                              disabled={issavingExpense === inputKey}
                              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                              title="บันทึกค่าเดินทาง"
                            >
                              {issavingExpense === inputKey ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
