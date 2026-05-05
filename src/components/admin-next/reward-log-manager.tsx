"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "./page-elements";

type Redemption = {
  id: string;
  pointsSpent: number;
  createdAt: string;
  member: { id: string; fullName: string; email: string | null; phone: string | null };
  rewardProduct: { id: string; name: string };
};

type Preset = "today" | "week" | "month" | "custom";

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = toDateString(now);
  if (preset === "today") return { from: to, to };
  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: toDateString(d), to };
  }
  if (preset === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateString(d), to };
  }
  return { from: "", to: "" };
}

export function RewardLogManager() {
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(() => getPresetRange("month").from);
  const [to, setTo] = useState(() => getPresetRange("month").to);
  const [rows, setRows] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function load(f: string, t: string) {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (f) qs.set("from", f);
      if (t) qs.set("to", t);
      const res = await fetch(`/api/reward-products/redemptions?${qs}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(from, to);
  }, []);

  function handlePreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const range = getPresetRange(p);
      setFrom(range.from);
      setTo(range.to);
      load(range.from, range.to);
    }
  }

  function handleSearch() {
    setPreset("custom");
    load(from, to);
  }

  const totalPoints = rows.reduce((s, r) => s + r.pointsSpent, 0);

  const presetBtns: { key: Preset; label: string }[] = [
    { key: "today", label: "วันนี้" },
    { key: "week", label: "7 วันล่าสุด" },
    { key: "month", label: "เดือนนี้" },
    { key: "custom", label: "กำหนดเอง" },
  ];

  return (
    <ContentCard
      title="Log การแลกแต้ม"
      description="บันทึกการแลกสินค้าด้วยแต้มสะสมของสมาชิก"
    >
      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {presetBtns.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handlePreset(btn.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                preset === btn.key
                  ? "bg-[#5f8f74] text-white"
                  : "border border-[#d8e6dd] text-dark hover:bg-[#f0f7f2] dark:border-dark-3 dark:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
            className="rounded-[10px] border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <span className="text-sm text-dark-5">ถึง</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
            className="rounded-[10px] border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <button
            onClick={handleSearch}
            className="rounded-full bg-[#5f8f74] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e7a61]"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 flex gap-4">
        <div className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-5 py-3 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-xs text-dark-5 dark:text-dark-6">รายการทั้งหมด</p>
          <p className="text-xl font-bold text-dark dark:text-white">{rows.length.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-5 py-3 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-xs text-dark-5 dark:text-dark-6">แต้มที่ใช้ไปทั้งหมด</p>
          <p className="text-xl font-bold text-[#5f8f74]">{totalPoints.toLocaleString()} pts</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-dark-5">กำลังโหลด...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8e6dd] py-16 text-center dark:border-dark-3">
          <p className="text-dark-5 dark:text-dark-6">ไม่มีข้อมูลในช่วงที่เลือก</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fbf9] dark:bg-dark-2">
                <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">วันที่</th>
                <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">สมาชิก</th>
                <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">สินค้าที่แลก</th>
                <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">แต้มที่ใช้</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-5 py-4 text-dark-5 dark:text-dark-6 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString("th-TH", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-dark dark:text-white">{row.member.fullName}</p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">{row.member.email ?? row.member.phone ?? ""}</p>
                  </td>
                  <td className="px-5 py-4 text-dark dark:text-white">{row.rewardProduct.name}</td>
                  <td className="px-5 py-4 text-center font-semibold text-[#5f8f74]">{row.pointsSpent.toLocaleString()} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ContentCard>
  );
}
