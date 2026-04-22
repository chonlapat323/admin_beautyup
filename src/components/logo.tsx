import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/images/logo.png"
        alt="Beauty Up"
        width={40}
        height={40}
        className="rounded-xl object-contain"
      />

      <div>
        <div className="text-lg font-bold leading-none text-dark dark:text-white">
          Beauty Up
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-[#6f8e7d]">
          Enterprise Admin
        </div>
      </div>
    </div>
  );
}
