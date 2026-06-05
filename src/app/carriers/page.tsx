import { ContentCard, PageIntro } from "@/components/admin-next/page-elements";
import { CarrierManager } from "@/components/admin-next/carrier-manager";

export default function CarriersPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="ระบบขนส่ง"
        title="ผู้ให้บริการขนส่ง"
        description="จัดการรายชื่อผู้ให้บริการขนส่งที่แสดงในระบบ — เพิ่ม แก้ไข หรือปิดใช้งานได้ตามต้องการ"
      />
      <ContentCard title="รายการผู้ให้บริการ">
        <CarrierManager />
      </ContentCard>
    </div>
  );
}
