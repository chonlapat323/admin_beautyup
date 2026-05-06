import {
  getCommissionStats,
  getMembersPageData,
  getOrderStats,
  getProductsPageData,
  type CommissionStatsResult,
  type OrderStatsResult,
} from "@/lib/admin-api";

export type { RecentOrderItem } from "@/lib/admin-api";

export type DashboardData = {
  revenue: number;
  orderCount: number;
  pendingOrderCount: number;
  memberCount: number;
  lowStockCount: number;
  commission: CommissionStatsResult;
  recentOrders: OrderStatsResult["recentOrders"];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [orderStats, membersData, productsData, commissionStats] = await Promise.all([
    getOrderStats(),
    getMembersPageData({ pageSize: 1 }),
    getProductsPageData({ pageSize: 200 }),
    getCommissionStats(),
  ]);

  const lowStockCount = productsData.items.filter((p) => p.stock > 0 && p.stock <= 10).length;

  return {
    revenue: orderStats.revenue,
    orderCount: orderStats.orderCount,
    pendingOrderCount: orderStats.pendingCount,
    memberCount: membersData.meta.totalItems,
    lowStockCount,
    commission: commissionStats,
    recentOrders: orderStats.recentOrders,
  };
}
