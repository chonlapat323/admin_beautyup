import {
  categories as fallbackCategories,
  members as fallbackMembers,
  orders as fallbackOrders,
  payments as fallbackPayments,
  products as fallbackProducts,
  settingsSections as fallbackSettingsSections,
} from "@/lib/admin-data";

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  eyebrow?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  requiresShadeSelection: boolean;
  sortOrder: number;
  isActive: boolean;
  processedBy?: string | null;
  processedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
};

export type CategoryListParams = {
  search?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
};

export type CategoryListMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiCategoryListResponse = {
  items: ApiCategory[];
  meta: CategoryListMeta;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  eyebrow: string;
  description: string;
  imageUrl: string | null;
  requiresShadeSelection: boolean;
  sortOrder: number;
  status: "Active" | "Inactive";
  isActive: boolean;
  products: string;
  updatedAt: string;
  processedBy: string;
  processedAt: string;
  source: "api" | "mock";
};

export type CategoryFormPayload = {
  name: string;
  slug: string;
  eyebrow?: string;
  description?: string;
  imageUrl?: string;
  requiresShadeSelection?: boolean;
  tempImageFile?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type ApiProductImage = {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
};

export type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  specialPrice?: string | null;
  stock: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  isFeatured: boolean;
  categoryId: string;
  category?: { id: string; name: string } | null;
  shadeId?: string | null;
  shade?: { id: string; name: string; shadeGroupId?: string } | null;
  images?: ApiProductImage[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  specialPrice: number | null;
  categoryId: string;
  categoryName: string;
  shadeId: string | null;
  shadeName: string | null;
  shadeGroupId: string | null;
  stock: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  isFeatured: boolean;
  thumbnail: string | null;
  updatedAt: string;
  source: "api" | "mock";
};

export type ProductFormPayload = {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  specialPrice?: number;
  categoryId: string;
  shadeId?: string | null;
  stock: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  isFeatured?: boolean;
  tempFiles?: string[];
  orderedImages?: Array<{ kind: "existing"; id: string } | { kind: "temp"; filename: string }>;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  admin: {
    id: string;
    email: string;
    role: string;
    roleId?: string | null;
  };
};

export type ApiMember = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  pointBalance: number;
  referredById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    orders: number;
    referrals: number;
  };
};

export type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  member?: { fullName: string; email: string | null; phone: string | null } | null;
};

export type ApiPayment = {
  orderNumber: string;
  method: string;
  status: string;
  amount: number;
};

export type ApiSettings = {
  shipping: {
    freeShippingThreshold: number;
    defaultShippingFee: number;
  };
  points: {
    threshold: number;
    earnedPoint: number;
  };
  referral: {
    commissionRate: number;
  };
  stock: {
    reservePercentage: number;
  };
};

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.ADMIN_API_URL ||
    "http://localhost:3000/api"
  );
}

async function fetchFromApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loginAdmin(payload: LoginPayload) {
  return fetchFromApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCategories() {
  try {
    const data = await fetchFromApi<ApiCategory[]>("/categories");

    return data.map(
      (category): CategoryRecord => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        eyebrow: category.eyebrow ?? "",
        description: category.description ?? "",
        imageUrl: category.imageUrl ?? null,
        requiresShadeSelection: category.requiresShadeSelection ?? false,
        sortOrder: category.sortOrder ?? 0,
        status: category.isActive ? "Active" : "Inactive",
        isActive: category.isActive,
        products: String(category._count?.products ?? 0),
        updatedAt: category.updatedAt
          ? new Intl.DateTimeFormat("th-TH", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(category.updatedAt))
          : "เชื่อมต่อหลังบ้าน",
        processedBy: category.processedBy ?? "system",
        processedAt: category.processedAt
          ? new Intl.DateTimeFormat("th-TH", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(category.processedAt))
          : "เชื่อมต่อหลังบ้าน",
        source: "api" as const,
      }),
    );
  } catch {
    return fallbackCategories.map(
      (category): CategoryRecord => ({
        id: category.name.toLowerCase().replace(/\s+/g, "-"),
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, "-"),
        eyebrow: "",
        description: "",
        imageUrl: null,
        requiresShadeSelection: false,
        sortOrder: 0,
        status: category.status === "Active" ? "Active" : "Inactive",
        isActive: category.status === "Active",
        products: String(category.products),
        updatedAt: category.updatedAt,
        processedBy: "system",
        processedAt: category.updatedAt,
        source: "mock" as const,
      }),
    );
  }
}

function formatCategoryDate(value?: string | null) {
  if (!value) {
    return "เชื่อมต่อหลังบ้าน";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapCategoryRecord(category: ApiCategory): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    eyebrow: category.eyebrow ?? "",
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? null,
    requiresShadeSelection: category.requiresShadeSelection ?? false,
    sortOrder: category.sortOrder ?? 0,
    status: category.isActive ? "Active" : "Inactive",
    isActive: category.isActive,
    products: String(category._count?.products ?? 0),
    updatedAt: formatCategoryDate(category.updatedAt),
    processedBy: category.processedBy ?? "system",
    processedAt: formatCategoryDate(category.processedAt),
    source: "api",
  };
}

export async function getCategoriesPageData(params: CategoryListParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));

  try {
    const data = await fetchFromApi<ApiCategoryListResponse>(`/categories?${searchParams.toString()}`);

    return {
      items: data.items.map(mapCategoryRecord),
      meta: data.meta,
    };
  } catch {
    const keyword = params.search?.trim().toLowerCase();
    const filteredItems = fallbackCategories
      .filter((category) => {
        if (!keyword) {
          return true;
        }

        return [category.name, category.name.toLowerCase().replace(/\s+/g, "-")].some((value) =>
          value.toLowerCase().includes(keyword),
        );
      })
      .filter((category) => {
        if (!params.status || params.status === "all") {
          return true;
        }

        return params.status === "active"
          ? category.status === "Active"
          : category.status !== "Active";
      });

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (page - 1) * pageSize;

    return {
      items: filteredItems.slice(startIndex, startIndex + pageSize).map(
        (category): CategoryRecord => ({
          id: category.name.toLowerCase().replace(/\s+/g, "-"),
          name: category.name,
          slug: category.name.toLowerCase().replace(/\s+/g, "-"),
          eyebrow: "",
          description: "",
          imageUrl: null,
          requiresShadeSelection: false,
          sortOrder: 0,
          status: category.status === "Active" ? "Active" : "Inactive",
          isActive: category.status === "Active",
          products: String(category.products),
          updatedAt: category.updatedAt,
          processedBy: "system",
          processedAt: category.updatedAt,
          source: "mock",
        }),
      ),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

export async function createCategory(payload: CategoryFormPayload) {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างหมวดหมู่ได้");
  }

  return response.json() as Promise<ApiCategory>;
}

export async function updateCategory(id: string, payload: CategoryFormPayload) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขหมวดหมู่ได้");
  }

  return response.json() as Promise<ApiCategory>;
}

export async function updateCategoryStatus(id: string, isActive: boolean) {
  const response = await fetch(`/api/categories/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้");
  }

  return response.json() as Promise<ApiCategory>;
}

export async function softDeleteCategory(id: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบหมวดหมู่ได้");
  }

  return response.json() as Promise<{ message?: string }>;
}

type ProductApiResponse = {
  items: ApiProduct[];
  meta: CategoryListMeta;
};

function mapProductRecord(product: ApiProduct): ProductRecord {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: parseFloat(product.price) || 0,
    specialPrice: product.specialPrice ? parseFloat(product.specialPrice) : null,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? "ไม่ระบุหมวดหมู่",
    shadeId: product.shadeId ?? null,
    shadeName: product.shade?.name ?? null,
    shadeGroupId: product.shade?.shadeGroupId ?? null,
    stock: product.stock,
    status: product.status,
    isFeatured: product.isFeatured ?? false,
    thumbnail: product.images?.[0]?.url ?? null,
    updatedAt: product.updatedAt
      ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(
          new Date(product.updatedAt),
        )
      : "-",
    source: "api",
  };
}

export async function getProductsPageData(
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: ProductRecord[]; meta: CategoryListMeta }> {
  const searchParams = new URLSearchParams();

  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));

  try {
    const data = await fetchFromApi<ProductApiResponse>(`/products?${searchParams.toString()}`);

    return {
      items: data.items.map(mapProductRecord),
      meta: data.meta,
    };
  } catch {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const items = fallbackProducts.slice((page - 1) * pageSize, page * pageSize).map(
      (p): ProductRecord => ({
        id: p.sku,
        sku: p.sku,
        name: p.name,
        slug: p.name.toLowerCase().replace(/\s+/g, "-"),
        description: "",
        price: parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0,
        specialPrice: null,
        categoryId: "",
        categoryName: p.category,
        shadeId: null,
        shadeName: null,
        shadeGroupId: null,
        stock: p.stock,
        status: p.status === "Active" ? "ACTIVE" : "INACTIVE",
        isFeatured: false,
        thumbnail: null,
        updatedAt: "-",
        source: "mock",
      }),
    );
    const totalItems = fallbackProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      meta: { page, pageSize, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }
}

export async function createProduct(payload: ProductFormPayload) {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างสินค้าได้");
  }

  return response.json() as Promise<ApiProduct>;
}

export async function updateProduct(id: string, payload: Partial<ProductFormPayload>) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขสินค้าได้");
  }

  return response.json() as Promise<ApiProduct>;
}

export async function updateProductStatus(id: string, status: "DRAFT" | "ACTIVE" | "INACTIVE") {
  const response = await fetch(`/api/products/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถเปลี่ยนสถานะสินค้าได้");
  }

  return response.json() as Promise<ApiProduct>;
}

export async function deleteProduct(id: string) {
  const response = await fetch(`/api/products/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบสินค้าได้");
  }

  return response.json() as Promise<{ message?: string }>;
}

export async function getMembers() {
  try {
    const data = await fetchFromApi<ApiMember[]>("/members");

    return data.map((member) => ({
      id: member.id,
      name: member.fullName,
      tier: member.pointBalance >= 900 ? "Gold" : member.pointBalance >= 300 ? "Silver" : "Basic",
      points: String(member.pointBalance),
      referrals: "เชื่อมต่อ API",
      spend: "รอข้อมูลหลังบ้าน",
      source: "api" as const,
    }));
  } catch {
    return fallbackMembers.map((member) => ({
      id: member.name.toLowerCase().replace(/\s+/g, "-"),
      name: member.name,
      tier: member.tier,
      points: String(member.points),
      referrals: String(member.referrals),
      spend: member.spend,
      source: "mock" as const,
    }));
  }
}

export async function getOrders() {
  try {
    const data = await fetchFromApi<ApiOrder[]>("/orders");

    return data.map((order) => ({
      id: order.id,
      code: order.orderNumber,
      member: order.member?.fullName ?? order.member?.email ?? order.member?.phone ?? "-",
      store: "-",
      total: `THB ${Number(order.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
      status: order.status,
      source: "api" as const,
    }));
  } catch {
    return fallbackOrders.map((order) => ({
      id: order.code,
      code: order.code,
      member: order.member,
      store: order.store,
      total: order.total,
      status: order.status,
      source: "mock" as const,
    }));
  }
}

export async function getPayments() {
  try {
    const data = await fetchFromApi<ApiPayment[]>("/payments");
    const grouped = new Map<string, { method: string; orders: number; successRate: string; note: string; source: "api" }>();

    for (const payment of data) {
      const current = grouped.get(payment.method);

      if (current) {
        current.orders += 1;
      } else {
        grouped.set(payment.method, {
          method: payment.method,
          orders: 1,
          successRate: "เชื่อมต่อหลังบ้าน",
          note: "สรุปจากรายการชำระเงินจริง",
          source: "api",
        });
      }
    }

    return Array.from(grouped.values());
  } catch {
    return fallbackPayments.map((payment) => ({
      method: payment.method,
      orders: payment.orders,
      successRate: payment.successRate,
      note: payment.note,
      source: "mock" as const,
    }));
  }
}

export async function getSettings() {
  try {
    const data = await fetchFromApi<ApiSettings>("/settings");

    return [
      {
        title: "กติกาการจัดส่ง",
        description: `ฟรีค่าจัดส่งเมื่อมียอดตั้งแต่ THB ${data.shipping.freeShippingThreshold} และคิดค่าจัดส่งปกติ THB ${data.shipping.defaultShippingFee}`,
        source: "api" as const,
      },
      {
        title: "กติกาแต้มสะสม",
        description: `มอบ ${data.points.earnedPoint} แต้มทุกการใช้จ่ายสำเร็จครบ THB ${data.points.threshold}`,
        source: "api" as const,
      },
      {
        title: "กติกาผู้แนะนำ",
        description: `ค่าคอมมิชชัน ${(data.referral.commissionRate * 100).toFixed(0)}% สำหรับคำสั่งซื้อจากการแนะนำที่สำเร็จ`,
        source: "api" as const,
      },
      {
        title: "กติกาสต็อก",
        description: `กันสต็อก ${data.stock.reservePercentage}% เพื่อลดความเสี่ยงในการขายเกินจำนวนจริง`,
        source: "api" as const,
      },
    ];
  } catch {
    return fallbackSettingsSections.map((section) => ({
      ...section,
      source: "mock" as const,
    }));
  }
}

// ===== Members (full CRUD) =====

export type MemberRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  pointBalance: number;
  orders: number;
  referrals: number;
  updatedAt: string;
  source: "api" | "mock";
};

export type MemberFormPayload = {
  fullName: string;
  phone?: string;
  email?: string;
  referredById?: string;
};

type MemberApiResponse = {
  items: ApiMember[];
  meta: CategoryListMeta;
};

function mapMemberRecord(member: ApiMember): MemberRecord {
  return {
    id: member.id,
    fullName: member.fullName,
    phone: member.phone ?? "",
    email: member.email ?? "",
    isActive: member.isActive,
    pointBalance: member.pointBalance,
    orders: member._count?.orders ?? 0,
    referrals: member._count?.referrals ?? 0,
    updatedAt: member.updatedAt
      ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(
          new Date(member.updatedAt),
        )
      : "-",
    source: "api",
  };
}

export async function getMembersPageData(
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: MemberRecord[]; meta: CategoryListMeta }> {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));

  try {
    const data = await fetchFromApi<MemberApiResponse>(`/members?${searchParams.toString()}`);
    return { items: data.items.map(mapMemberRecord), meta: data.meta };
  } catch {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    return {
      items: fallbackMembers.slice((page - 1) * pageSize, page * pageSize).map(
        (m): MemberRecord => ({
          id: m.name.toLowerCase().replace(/\s+/g, "-"),
          fullName: m.name,
          phone: "",
          email: "",
          isActive: true,
          pointBalance: m.points,
          orders: 0,
          referrals: Number(m.referrals) || 0,
          updatedAt: "-",
          source: "mock",
        }),
      ),
      meta: {
        page,
        pageSize,
        totalItems: fallbackMembers.length,
        totalPages: Math.max(1, Math.ceil(fallbackMembers.length / pageSize)),
        hasNextPage: page < Math.ceil(fallbackMembers.length / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  }
}

export async function createMember(payload: MemberFormPayload) {
  const response = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างสมาชิกได้");
  }
  return response.json() as Promise<ApiMember>;
}

export async function updateMember(id: string, payload: Partial<MemberFormPayload>) {
  const response = await fetch(`/api/members/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขสมาชิกได้");
  }
  return response.json() as Promise<ApiMember>;
}

export async function updateMemberStatus(id: string, isActive: boolean) {
  const response = await fetch(`/api/members/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถเปลี่ยนสถานะสมาชิกได้");
  }
  return response.json() as Promise<ApiMember>;
}

export async function deleteMember(id: string) {
  const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบสมาชิกได้");
  }
  return response.json() as Promise<{ message?: string }>;
}

// ===== Admin Users =====

export type ApiAdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  role?: { id: string; name: string } | null;
  isActive: boolean;
  storeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  roleId: string | null;
  roleName: string;
  isActive: boolean;
  updatedAt: string;
  source: "api" | "mock";
};

export type AdminUserFormPayload = {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
};

type AdminUserApiResponse = {
  items: ApiAdminUser[];
  meta: CategoryListMeta;
};

function mapAdminUserRecord(user: ApiAdminUser): AdminUserRecord {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    roleId: user.roleId ?? null,
    roleName: user.role?.name ?? "ไม่ระบุ",
    isActive: user.isActive,
    updatedAt: user.updatedAt
      ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(
          new Date(user.updatedAt),
        )
      : "-",
    source: "api",
  };
}

export async function getAdminUsersPageData(
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: AdminUserRecord[]; meta: CategoryListMeta }> {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 10));

  try {
    const data = await fetchFromApi<AdminUserApiResponse>(`/admin-users?${searchParams.toString()}`);
    return { items: data.items.map(mapAdminUserRecord), meta: data.meta };
  } catch {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    return {
      items: [],
      meta: { page, pageSize, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  }
}

export async function createAdminUser(payload: AdminUserFormPayload & { password: string }) {
  const response = await fetch("/api/admin-users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างผู้ดูแลระบบได้");
  }
  return response.json() as Promise<ApiAdminUser>;
}

export async function updateAdminUser(id: string, payload: Partial<AdminUserFormPayload>) {
  const response = await fetch(`/api/admin-users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขผู้ดูแลระบบได้");
  }
  return response.json() as Promise<ApiAdminUser>;
}

export async function updateAdminUserStatus(id: string, isActive: boolean) {
  const response = await fetch(`/api/admin-users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถเปลี่ยนสถานะผู้ดูแลระบบได้");
  }
  return response.json() as Promise<ApiAdminUser>;
}

export async function deleteAdminUser(id: string) {
  const response = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบผู้ดูแลระบบได้");
  }
  return response.json() as Promise<{ message?: string }>;
}

// ===== Roles =====

export type MenuPermission = {
  menu: string;
  label: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type ApiRole = {
  id: string;
  name: string;
  permissions: MenuPermission[];
  isActive: boolean;
  _count?: { admins: number };
  createdAt?: string;
  updatedAt?: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  permissions: MenuPermission[];
  isActive: boolean;
  adminCount: number;
  updatedAt: string;
  source: "api" | "mock";
};

export type RoleFormPayload = {
  name: string;
  permissions: MenuPermission[];
};

type RoleApiResponse = {
  items: ApiRole[];
  meta: CategoryListMeta;
};

function mapRoleRecord(role: ApiRole): RoleRecord {
  return {
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    isActive: role.isActive,
    adminCount: role._count?.admins ?? 0,
    updatedAt: role.updatedAt
      ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(
          new Date(role.updatedAt),
        )
      : "-",
    source: "api",
  };
}

export async function getRolesPageData(
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: RoleRecord[]; meta: CategoryListMeta }> {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 20));

  try {
    const data = await fetchFromApi<RoleApiResponse>(`/roles?${searchParams.toString()}`);
    return { items: data.items.map(mapRoleRecord), meta: data.meta };
  } catch {
    return {
      items: [],
      meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  }
}

export async function createRole(payload: RoleFormPayload) {
  const response = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างสิทธิ์ได้");
  }
  return response.json() as Promise<ApiRole>;
}

export async function updateRole(id: string, payload: Partial<RoleFormPayload>) {
  const response = await fetch(`/api/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขสิทธิ์ได้");
  }
  return response.json() as Promise<ApiRole>;
}

export async function updateRoleStatus(id: string, isActive: boolean) {
  const response = await fetch(`/api/roles/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถเปลี่ยนสถานะสิทธิ์ได้");
  }
  return response.json() as Promise<ApiRole>;
}

export async function deleteRole(id: string) {
  const response = await fetch(`/api/roles/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบสิทธิ์ได้");
  }
  return response.json() as Promise<{ message?: string }>;
}

// ===== Shade Groups =====

export type ApiShadeItem = {
  id: string;
  shadeGroupId: string;
  name: string;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ApiShadeGroup = {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  shades: ApiShadeItem[];
};

export async function getShadeGroups(categoryId: string): Promise<ApiShadeGroup[]> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups`, { cache: "no-store" });
  if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลกลุ่มเฉดสีได้");
  return response.json() as Promise<ApiShadeGroup[]>;
}

export async function createShadeGroup(categoryId: string, payload: { name: string; sortOrder?: number }): Promise<ApiShadeGroup> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างกลุ่มเฉดสีได้");
  }
  return response.json() as Promise<ApiShadeGroup>;
}

export async function updateShadeGroup(
  categoryId: string,
  groupId: string,
  payload: Partial<{ name: string; sortOrder: number; isActive: boolean }>,
): Promise<ApiShadeGroup> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขกลุ่มเฉดสีได้");
  }
  return response.json() as Promise<ApiShadeGroup>;
}

export async function deleteShadeGroup(categoryId: string, groupId: string): Promise<void> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบกลุ่มเฉดสีได้");
  }
}

export async function createShadeItem(categoryId: string, groupId: string, payload: { name: string; sortOrder?: number }): Promise<ApiShadeItem> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}/shades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถสร้างเฉดสีได้");
  }
  return response.json() as Promise<ApiShadeItem>;
}

export async function updateShadeItem(
  categoryId: string,
  groupId: string,
  shadeId: string,
  payload: Partial<{ name: string; isActive: boolean; sortOrder: number }>,
): Promise<ApiShadeItem> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}/shades/${shadeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถแก้ไขเฉดสีได้");
  }
  return response.json() as Promise<ApiShadeItem>;
}

export async function uploadShadeItemImage(categoryId: string, groupId: string, shadeId: string, file: File): Promise<ApiShadeItem> {
  const fd = new FormData();
  fd.append("file", file);
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}/shades/${shadeId}/image`, {
    method: "POST",
    body: fd,
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถอัปโหลดรูปได้");
  }
  return response.json() as Promise<ApiShadeItem>;
}

export async function deleteShadeItem(categoryId: string, groupId: string, shadeId: string): Promise<void> {
  const response = await fetch(`/api/categories/${categoryId}/shade-groups/${groupId}/shades/${shadeId}`, { method: "DELETE" });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "ไม่สามารถลบเฉดสีได้");
  }
}

export async function getRolesList(): Promise<{ id: string; name: string }[]> {
  try {
    const data = await fetchFromApi<RoleApiResponse>("/roles?status=active&pageSize=100");
    return data.items.map((r) => ({ id: r.id, name: r.name }));
  } catch {
    return [];
  }
}
