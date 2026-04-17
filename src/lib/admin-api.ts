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
  isActive: boolean;
};

export type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  status: string;
  stock: number;
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
  };
};

export type ApiMember = {
  id: string;
  fullName: string;
  phone: string;
  pointBalance: number;
};

export type ApiOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
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

    return data.map((category) => ({
      id: category.id,
      name: category.name,
      status: category.isActive ? "Active" : "Inactive",
      products: "API linked",
      updatedAt: "Live backend",
      slug: category.slug,
      source: "api" as const,
    }));
  } catch {
    return fallbackCategories.map((category) => ({
      id: category.name.toLowerCase().replace(/\s+/g, "-"),
      name: category.name,
      status: category.status,
      products: String(category.products),
      updatedAt: category.updatedAt,
      slug: category.name.toLowerCase().replace(/\s+/g, "-"),
      source: "mock" as const,
    }));
  }
}

export async function getProducts() {
  try {
    const data = await fetchFromApi<ApiProduct[]>("/products");

    return data.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: "API linked",
      price: "Pending backend",
      stock: String(product.stock),
      status: product.status,
      source: "api" as const,
    }));
  } catch {
    return fallbackProducts.map((product) => ({
      id: product.sku,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: String(product.stock),
      status: product.status,
      source: "mock" as const,
    }));
  }
}

export async function getMembers() {
  try {
    const data = await fetchFromApi<ApiMember[]>("/members");

    return data.map((member) => ({
      id: member.id,
      name: member.fullName,
      tier: member.pointBalance >= 900 ? "Gold" : member.pointBalance >= 300 ? "Silver" : "Basic",
      points: String(member.pointBalance),
      referrals: "API linked",
      spend: "Pending backend",
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
      member: "API linked",
      store: "Pending backend",
      total: `THB ${order.totalAmount}`,
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
          successRate: "Live backend",
          note: "Aggregated from payment records",
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
        title: "Shipping Rules",
        description: `Free shipping from THB ${data.shipping.freeShippingThreshold} and default fee THB ${data.shipping.defaultShippingFee}.`,
        source: "api" as const,
      },
      {
        title: "Point Rules",
        description: `Award ${data.points.earnedPoint} points for each THB ${data.points.threshold} spent successfully.`,
        source: "api" as const,
      },
      {
        title: "Referral Rules",
        description: `Commission rate is ${(data.referral.commissionRate * 100).toFixed(0)}% for successful referred orders.`,
        source: "api" as const,
      },
      {
        title: "Stock Rules",
        description: `Reserve ${data.stock.reservePercentage}% of stock to reduce overselling risk.`,
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
