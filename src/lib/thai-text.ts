const STATUS_MAP: Record<string, string> = {
  Active: "เปิดใช้งาน",
  Inactive: "ปิดใช้งาน",
  Draft: "ฉบับร่าง",
  Pending: "รอดำเนินการ",
  Paid: "ชำระแล้ว",
  Delivered: "จัดส่งแล้ว",
  Preparing: "กำลังเตรียมสินค้า",
  Processing: "กำลังดำเนินการ",
  "Low stock": "สต็อกต่ำ",
  Gold: "โกลด์",
  Silver: "ซิลเวอร์",
  Basic: "ทั่วไป",
  "Super Admin": "ซูเปอร์แอดมิน",
  Admin: "แอดมิน",
  "Full access": "สิทธิ์ทั้งหมด",
  "No access": "ไม่มีสิทธิ์",
  "Store-level only": "เฉพาะระดับสาขา",
};

const SOURCE_BADGE_MAP: Record<"api" | "mock", string> = {
  api: "เชื่อมต่อ API",
  mock: "ข้อมูลตัวอย่าง",
};

export function toThaiLabel(value: string) {
  return STATUS_MAP[value] ?? value;
}

export function toThaiSourceBadge(source: "api" | "mock") {
  return SOURCE_BADGE_MAP[source];
}
