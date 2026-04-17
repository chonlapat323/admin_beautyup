import { LoginFormClient } from "@/components/admin/LoginFormClient";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-4 py-10 dark:bg-[#020d1a]">
      <div className="grid w-full max-w-6xl gap-6 rounded-[28px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
        <section className="rounded-[24px] bg-[#355846] p-8 text-white lg:p-10">
          <div className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-semibold tracking-[0.22em] text-[#d5eadc]">
            BEAUTY UP ENTERPRISE
          </div>

          <h1 className="mt-8 max-w-xl text-3xl font-bold leading-tight lg:text-[40px]">
            จัดการสินค้า คำสั่งซื้อ สมาชิก และรายงานได้อย่างเป็นระบบ
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#d7e8dd]">
            เข้าสู่ระบบหลังบ้านสำหรับทีม Beauty Up เพื่อตรวจสอบความพร้อมของสินค้า
            ติดตามช่องทางการชำระเงิน และดูแลกติกาการทำงานให้สอดคล้องกันทุกสาขา
          </p>

          <div className="mt-10 space-y-4">
            {[
              "จัดการหมวดหมู่ สินค้า ราคา และสถานะสต็อกได้ในหน้าจอเดียว",
              "ติดตามการชำระเงินผ่าน PromptPay บัตร และ TrueMoney ก่อนส่งมอบสินค้า",
              "ตรวจสอบแต้มสะสม การแนะนำสมาชิก และรายงานของแต่ละสาขาได้จากบัญชีเดียว",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-[#edf7f0]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center p-4 lg:p-8">
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5f8f74]">
              เข้าสู่ระบบผู้ดูแล
            </p>
            <h2 className="mt-4 text-3xl font-bold text-dark dark:text-white">ยินดีต้อนรับกลับ</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-dark-5 dark:text-dark-6">
              เข้าสู่แดชบอร์ดผู้ดูแลของ Beauty Up เพื่อตรวจสอบการดำเนินงานและดูแลระบบให้พร้อมใช้งาน
            </p>

            <div className="mt-8 rounded-[24px] border border-stroke bg-[#fbfdfb] p-6 dark:border-dark-3 dark:bg-dark-2">
              <LoginFormClient />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
