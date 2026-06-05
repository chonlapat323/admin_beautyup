const STATUS_MAP: Record<string, string> = {
  ACTIVE: "เปิดใช้งาน",
  INACTIVE: "ปิดใช้งาน",
  DRAFT: "ฉบับร่าง",
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  PROCESSING: "กำลังดำเนินการ",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ส่งถึงแล้ว",
  CANCELLED: "ยกเลิก",
  PREPARING: "กำลังเตรียมสินค้า",
  "LOW STOCK": "สต็อกต่ำ",
  GOLD: "โกลด์",
  SILVER: "ซิลเวอร์",
  BASIC: "ทั่วไป",
  "SUPER ADMIN": "ซูเปอร์แอดมิน",
  ADMIN: "แอดมิน",
  "FULL ACCESS": "สิทธิ์ทั้งหมด",
  "NO ACCESS": "ไม่มีสิทธิ์",
  "STORE-LEVEL ONLY": "เฉพาะระดับสาขา",
};

const SOURCE_BADGE_MAP: Record<"api" | "mock", string> = {
  api: "เชื่อมต่อ API",
  mock: "ข้อมูลตัวอย่าง",
};

export function toThaiLabel(value: string) {
  return STATUS_MAP[value.toUpperCase()] ?? value;
}

export function toThaiSourceBadge(source: "api" | "mock") {
  return SOURCE_BADGE_MAP[source];
}
