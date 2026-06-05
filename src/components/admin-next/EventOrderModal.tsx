"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ApiBrand, ApiCategory, ApiCollection } from "@/lib/admin-api";

type ApiProductSimple = {
  id: string;
  name: string;
  sku: string;
  brandId?: string;
  categoryId: string;
  collectionId?: string;
  sellableStock: number;
  price: string;
  status: string;
};

type SelectedItem = {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  quantity: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">
      {children}
    </p>
  );
}

export function EventOrderModal({ isOpen, onClose, onSuccess }: Props) {
  // Shipping
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddr, setShippingAddr] = useState("");
  const [note, setNote] = useState("");

  // Filters
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterCollectionId, setFilterCollectionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Reference data (small — load once on open)
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [allCategories, setAllCategories] = useState<ApiCategory[]>([]);
  const [allCollections, setAllCollections] = useState<ApiCollection[]>([]);

  // Products — fetched on demand
  const [products, setProducts] = useState<ApiProductSimple[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected items
  const [items, setItems] = useState<SelectedItem[]>([]);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  // Load brands/categories/collections on open (small datasets)
  useEffect(() => {
    if (!isOpen) return;
    async function loadRefData() {
      const [brandsRes, categoriesRes, collectionsRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/categories?pageSize=200&status=all"),
        fetch("/api/collections"),
      ]);
      if (brandsRes.ok) setBrands((await brandsRes.json() as ApiBrand[]) ?? []);
      if (categoriesRes.ok) {
        const d = await categoriesRes.json() as { items: ApiCategory[] };
        setAllCategories(Array.isArray(d?.items) ? d.items : []);
      }
      if (collectionsRes.ok) setAllCollections((await collectionsRes.json() as ApiCollection[]) ?? []);
    }
    void loadRefData();
  }, [isOpen]);

  // Fetch products from server whenever filter/search changes (debounced)
  const fetchProducts = useCallback(async (query: string, brandId: string, categoryId: string, collectionId: string) => {
    const params = new URLSearchParams({ status: "active", pageSize: "50" });
    if (query.trim()) params.set("search", query.trim());
    if (brandId) params.set("brandId", brandId);
    if (categoryId) params.set("categoryId", categoryId);
    if (collectionId) params.set("collectionId", collectionId);

    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json() as unknown;
      if (Array.isArray(data)) setProducts(data as ApiProductSimple[]);
      else if (data && typeof data === "object" && "items" in data) setProducts((data as { items: ApiProductSimple[] }).items ?? []);
    } catch { /* ignore */ } finally {
      setIsLoadingProducts(false);
      setHasSearched(true);
    }
  }, []);

  // Trigger fetch when any filter/search changes — debounced 350ms
  useEffect(() => {
    const hasFilter = searchQuery.trim().length >= 2 || filterBrandId || filterCategoryId || filterCollectionId;
    if (!isOpen || !hasFilter) {
      setProducts([]);
      setHasSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchProducts(searchQuery, filterBrandId, filterCategoryId, filterCollectionId);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [isOpen, searchQuery, filterBrandId, filterCategoryId, filterCollectionId, fetchProducts]);

  // Reset filter downstream when parent filter changes
  useEffect(() => { setFilterCategoryId(""); setFilterCollectionId(""); }, [filterBrandId]);
  useEffect(() => { setFilterCollectionId(""); }, [filterCategoryId]);

  // Derived filter lists
  const filteredCategories = useMemo(() => {
    if (!filterBrandId) return allCategories;
    return allCategories.filter((c) => c.brandId === filterBrandId);
  }, [allCategories, filterBrandId]);

  const filteredCollections = useMemo(() => {
    if (!filterCategoryId) return allCollections;
    return allCollections.filter((c) => c.categoryId === filterCategoryId);
  }, [allCollections, filterCategoryId]);

  const hasActiveFilter = searchQuery.trim().length >= 2 || !!filterBrandId || !!filterCategoryId || !!filterCollectionId;

  function addItem(product: ApiProductSimple) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      // bump quantity if not at stock limit
      if (existing.quantity < existing.stock) {
        setItems((prev) =>
          prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        );
      }
      return;
    }
    if (product.sellableStock <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.sellableStock,
        price: parseFloat(product.price) || 0,
        quantity: 1,
      },
    ]);
  }

  function changeQty(productId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = Math.min(i.stock, Math.max(1, i.quantity + delta));
          return { ...i, quantity: next };
        })
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function resetState() {
    setShippingName("");
    setShippingPhone("");
    setShippingAddr("");
    setNote("");
    setFilterBrandId("");
    setFilterCategoryId("");
    setFilterCollectionId("");
    setBrands([]);
    setAllCategories([]);
    setAllCollections([]);
    setItems([]);
    setError("");
    setSearchQuery("");
    setProducts([]);
    setHasSearched(false);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetState();
    onClose();
  }

  async function handleSubmit() {
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddr.trim() || items.length === 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      const r = await fetch("/api/orders/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingName: shippingName.trim(),
          shippingPhone: shippingPhone.trim(),
          shippingAddr: shippingAddr.trim(),
          note: note.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const e = (await r.json().catch(() => null)) as { message?: string } | null;
        const msg = e?.message ?? "ไม่สามารถสร้างคำสั่งซื้อได้";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      showToast("สร้าง Event Order สำเร็จ", "success");
      resetState();
      onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    shippingName.trim() !== "" &&
    shippingPhone.trim() !== "" &&
    shippingAddr.trim() !== "" &&
    items.length > 0 &&
    !isSubmitting;

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between bg-gradient-to-r from-[#f0faf4] to-[#f8fbf9] px-6 py-5 dark:from-dark-2 dark:to-dark-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">Admin · Event</p>
            <h3 className="mt-1 text-xl font-bold text-dark dark:text-white">สร้าง Event Order</h3>
            <p className="mt-0.5 text-xs text-dark-5">ส่งสินค้าจัดงาน — ส่วนลด 100% · ยอดรวม ฿0</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-white hover:text-dark dark:hover:bg-dark-3"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="space-y-6 p-6">

            {/* Section 1: Shipping */}
            <div className="rounded-xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
              <SectionLabel>ที่อยู่จัดส่ง</SectionLabel>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-5">
                    ชื่อผู้รับ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="ชื่อผู้รับสินค้า"
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark placeholder:text-dark-5 focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-5">
                    เบอร์โทร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark placeholder:text-dark-5 focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-5">
                    ที่อยู่ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={shippingAddr}
                    onChange={(e) => setShippingAddr(e.target.value)}
                    placeholder="ที่อยู่จัดส่งโดยละเอียด..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark placeholder:text-dark-5 focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Products */}
            <div>
              <SectionLabel>เลือกสินค้า</SectionLabel>

              {/* Search */}
              <div className="relative mb-2">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
                  className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-9 pr-4 text-sm text-dark placeholder:text-dark-5 focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-5 hover:text-dark"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter row */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                <select
                  value={filterBrandId}
                  onChange={(e) => setFilterBrandId(e.target.value)}
                  className="rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  <option value="">ทุกแบรนด์</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterCollectionId}
                  onChange={(e) => setFilterCollectionId(e.target.value)}
                  className="rounded-xl border border-stroke bg-white px-3 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                >
                  <option value="">ทุกคอลเลกชัน</option>
                  {filteredCollections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Product list */}
              <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                {isLoadingProducts ? (
                  <div className="space-y-0">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-stroke px-4 py-3 last:border-b-0 dark:border-dark-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="h-4 w-40 animate-pulse rounded bg-dark-5/20" />
                          <div className="h-3 w-24 animate-pulse rounded bg-dark-5/10" />
                        </div>
                        <div className="h-8 w-16 animate-pulse rounded-xl bg-dark-5/10" />
                      </div>
                    ))}
                  </div>
                ) : !hasActiveFilter ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                      <svg className="h-6 w-6 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-dark dark:text-white">ค้นหาสินค้า</p>
                    <p className="mt-1 text-sm text-dark-5">พิมพ์ชื่อ / SKU หรือเลือก filter เพื่อดูสินค้า</p>
                  </div>
                ) : hasSearched && products.length === 0 ? (
                  <div className="flex flex-col items-center py-10">
                    <p className="font-semibold text-dark dark:text-white">ไม่พบสินค้า</p>
                    <p className="mt-1 text-sm text-dark-5">ลองเปลี่ยนคำค้นหาหรือ filter</p>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    {products.map((product) => {
                      const outOfStock = product.sellableStock <= 0;
                      const alreadyAdded = items.some((i) => i.productId === product.id);
                      return (
                        <div key={product.id} className="flex items-center justify-between border-b border-stroke px-4 py-3 last:border-b-0 dark:border-dark-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-dark dark:text-white">{product.name}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="font-mono text-xs text-dark-5">{product.sku}</span>
                              {outOfStock ? (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">หมด</span>
                              ) : (
                                <span className="text-xs text-dark-5">stock {product.sellableStock}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => addItem(product)}
                            className={`ml-3 flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                              outOfStock
                                ? "cursor-not-allowed bg-[#f3f4f6] text-dark-5 dark:bg-dark-3"
                                : alreadyAdded
                                ? "bg-[#edf7f1] text-[#2f7a4f] hover:bg-[#d9f0e3] dark:bg-dark-3 dark:text-[#5f8f74]"
                                : "bg-[#45745a] text-white hover:bg-[#355846]"
                            }`}
                          >
                            + เพิ่ม
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected items */}
              {items.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-dark-5">รายการที่เลือก ({items.length})</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 rounded-xl border border-[#d7e7dc] bg-[#f8fbf9] px-4 py-3 dark:border-dark-3 dark:bg-dark-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-dark dark:text-white">{item.name}</p>
                          <p className="font-mono text-xs text-dark-5">{item.sku}</p>
                        </div>
                        {/* Quantity stepper */}
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => changeQty(item.productId, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d7e7dc] text-sm text-[#355846] hover:bg-[#f0f9f4] dark:border-dark-3 dark:text-[#5f8f74]"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold text-dark dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.stock}
                            onClick={() => changeQty(item.productId, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d7e7dc] text-sm text-[#355846] hover:bg-[#f0f9f4] disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-3 dark:text-[#5f8f74]"
                          >
                            +
                          </button>
                        </div>
                        {/* Subtotal */}
                        <span className="w-20 flex-shrink-0 text-right text-sm font-semibold text-[#2f7a4f]">
                          ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                        </span>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="flex-shrink-0 text-dark-5 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Total row */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#45745a] bg-[#f0faf4] px-4 py-3 dark:border-[#45745a]/50 dark:bg-dark-2">
                    <span className="text-sm font-semibold text-dark dark:text-white">
                      ยอดรวม (discount 100%)
                    </span>
                    <span className="text-lg font-bold text-[#2f7a4f]">฿0</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Note */}
            <div>
              <SectionLabel>หมายเหตุ</SectionLabel>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (ไม่บังคับ)..."
                rows={3}
                className="w-full resize-none rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark placeholder:text-dark-5 focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="rounded-full bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "กำลังสร้าง..." : "สร้าง Event Order"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
