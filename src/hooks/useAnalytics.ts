import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '../database';
import { TABLES } from '../database/schema';

export type Period = 'daily' | 'weekly' | 'monthly';

interface SalesStats {
  totalRevenue: number;
  totalTransactions: number;
  cashSales: number;
  mpesaSales: number;
  averageTransactionValue: number;
  previousPeriodRevenue: number;
  revenueChange: number;
}

interface TopProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  quantitySold: number;
  revenue: number;
}

interface PaymentMethodStats {
  cash: number;
  mpesa: number;
}

interface HourlyStats {
  hour: number;
  revenue: number;
  transactions: number;
}

function getDateRange(period: Period): { start: Date; end: Date; previousStart: Date } {
  const end = new Date();
  const start = new Date();
  const previousStart = new Date();

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 14);
      previousStart.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 60);
      previousStart.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end, previousStart };
}

async function fetchSalesStats(period: Period): Promise<SalesStats> {
  const db = getDatabase();
  const { start, end, previousStart } = getDateRange(period);

  // Current period stats
  const currentStats = await db.getFirstAsync<{
    totalRevenue: number;
    totalTransactions: number;
  }>(`
    SELECT 
      COALESCE(SUM(total), 0) as totalRevenue,
      COUNT(*) as totalTransactions
    FROM ${TABLES.SALES}
    WHERE created_at >= ? AND created_at <= ?
  `, [start.toISOString(), end.toISOString()]);

  // Previous period revenue for comparison
  const previousStats = await db.getFirstAsync<{ revenue: number }>(`
    SELECT COALESCE(SUM(total), 0) as revenue
    FROM ${TABLES.SALES}
    WHERE created_at >= ? AND created_at < ?
  `, [previousStart.toISOString(), start.toISOString()]);

  // Payment method breakdown
  const cashPayment = await db.getFirstAsync<{ amount: number }>(`
    SELECT COALESCE(SUM(p.amount), 0) as amount
    FROM ${TABLES.PAYMENTS} p
    JOIN ${TABLES.SALES} s ON p.sale_id = s.id
    WHERE p.method = 'CASH' AND s.created_at >= ? AND s.created_at <= ?
  `, [start.toISOString(), end.toISOString()]);

  const mpesaPayment = await db.getFirstAsync<{ amount: number }>(`
    SELECT COALESCE(SUM(p.amount), 0) as amount
    FROM ${TABLES.PAYMENTS} p
    JOIN ${TABLES.SALES} s ON p.sale_id = s.id
    WHERE p.method = 'MPESA' AND s.created_at >= ? AND s.created_at <= ?
  `, [start.toISOString(), end.toISOString()]);

  const totalRevenue = currentStats?.totalRevenue || 0;
  const previousRevenue = previousStats?.revenue || 0;
  const revenueChange = previousRevenue > 0
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  return {
    totalRevenue,
    totalTransactions: currentStats?.totalTransactions || 0,
    cashSales: cashPayment?.amount || 0,
    mpesaSales: mpesaPayment?.amount || 0,
    averageTransactionValue:
      currentStats?.totalTransactions
        ? totalRevenue / currentStats.totalTransactions
        : 0,
    previousPeriodRevenue: previousRevenue,
    revenueChange,
  };
}

async function fetchTopProducts(period: Period, limit: number = 10): Promise<TopProduct[]> {
  const db = getDatabase();
  const { start, end } = getDateRange(period);

  const results = await db.getAllAsync<{
    id: string;
    name: string;
    imageUrl: string | null;
    quantitySold: number;
    revenue: number;
  }>(`
    SELECT 
      p.id,
      p.name,
      p.image_url as imageUrl,
      SUM(si.quantity) as quantitySold,
      SUM(si.total) as revenue
    FROM ${TABLES.SALE_ITEMS} si
    JOIN ${TABLES.SALES} s ON si.sale_id = s.id
    JOIN ${TABLES.PRODUCTS} p ON si.product_id = p.id
    WHERE s.created_at >= ? AND s.created_at <= ?
    GROUP BY p.id, p.name, p.image_url
    ORDER BY revenue DESC
    LIMIT ?
  `, [start.toISOString(), end.toISOString(), limit]);

  return results || [];
}

async function fetchPaymentMethodStats(period: Period): Promise<PaymentMethodStats> {
  const db = getDatabase();
  const { start, end } = getDateRange(period);

  const cash = await db.getFirstAsync<{ amount: number }>(`
    SELECT COALESCE(SUM(p.amount), 0) as amount
    FROM ${TABLES.PAYMENTS} p
    JOIN ${TABLES.SALES} s ON p.sale_id = s.id
    WHERE p.method = 'CASH' AND s.created_at >= ? AND s.created_at <= ?
  `, [start.toISOString(), end.toISOString()]);

  const mpesa = await db.getFirstAsync<{ amount: number }>(`
    SELECT COALESCE(SUM(p.amount), 0) as amount
    FROM ${TABLES.PAYMENTS} p
    JOIN ${TABLES.SALES} s ON p.sale_id = s.id
    WHERE p.method = 'MPESA' AND s.created_at >= ? AND s.created_at <= ?
  `, [start.toISOString(), end.toISOString()]);

  return {
    cash: cash?.amount || 0,
    mpesa: mpesa?.amount || 0,
  };
}

async function fetchHourlyStats(period: Period): Promise<HourlyStats[]> {
  const db = getDatabase();
  const { start, end } = getDateRange(period);

  // Only for daily and weekly periods
  if (period === 'monthly') {
    return [];
  }

  const results = await db.getAllAsync<{
    hour: number;
    revenue: number;
    transactions: number;
  }>(`
    SELECT 
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      SUM(total) as revenue,
      COUNT(*) as transactions
    FROM ${TABLES.SALES}
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY hour
    ORDER BY hour
  `, [start.toISOString(), end.toISOString()]);

  return results || [];
}

async function fetchProductCount(): Promise<number> {
  const db = getDatabase();
  
  const result = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM ${TABLES.PRODUCTS}
    WHERE is_active = 1
  `);

  return result?.count || 0;
}

export function useSalesStats(period: Period) {
  return useQuery({
    queryKey: ['analytics', 'salesStats', period],
    queryFn: () => fetchSalesStats(period),
  });
}

export function useTopProducts(period: Period, limit: number = 10) {
  return useQuery({
    queryKey: ['analytics', 'topProducts', period, limit],
    queryFn: () => fetchTopProducts(period, limit),
  });
}

export function usePaymentMethodStats(period: Period) {
  return useQuery({
    queryKey: ['analytics', 'paymentMethods', period],
    queryFn: () => fetchPaymentMethodStats(period),
  });
}

export function useHourlyStats(period: Period) {
  return useQuery({
    queryKey: ['analytics', 'hourlyStats', period],
    queryFn: () => fetchHourlyStats(period),
    enabled: period !== 'monthly',
  });
}

export function useProductCount() {
  return useQuery({
    queryKey: ['analytics', 'productCount'],
    queryFn: fetchProductCount,
  });
}
