import React from 'react';
import Link from 'next/link';
import { getUserProfile, isContact } from '@/lib/auth';
import {ContactModel, ProductModel, InventoryModel, OrderModel, CostCategoryModel} from '@/lib/models';
import { formatDistanceToNow } from 'date-fns';
import { FaUsers, FaBoxes, FaShoppingCart, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrderCountsChart from '@/components/dashboard/OrderCountsChart';
import CostBreakdownChart from '@/components/dashboard/CostBreakdownChart';

async function getStats(userId?: string, userRole?: string) {
  try {
    console.log('📊 Getting dashboard stats...');

    if (userRole === 'contact' && userId) {
      // Contact users only see their own data
      const orderCount = await OrderModel.getCountByUser(userId);
      console.log('🛒 User order count:', orderCount);

      const orderCompletionStats = await OrderModel.getCompletionStatsByUser(userId);
      console.log('📊 User order completion stats:', orderCompletionStats);

      return {
        orderCount: orderCount || 0,
        orderCompletionStats: orderCompletionStats
      };
    } else {
      // Admin and other roles see all data
      const contactCount = await ContactModel.getCount();
      console.log('👥 Contact count:', contactCount);

      const contactCountWithEmail = await ContactModel.getCountWithEmail();
      console.log('📧 Contact count with email:', contactCountWithEmail);

      const contactCountWithPhone = await ContactModel.getCountWithPhone();
      console.log('📞 Contact count with phone:', contactCountWithPhone);

      const productCount = await ProductModel.getCount();
      console.log('📦 Product count (active):', productCount);

      const totalProductCount = await ProductModel.getTotalCount();
      console.log('📦 Total product count:', totalProductCount);

      const orderCount = await OrderModel.getCount();
      console.log('🛒 Order count:', orderCount);

      const orderCompletionStats = await OrderModel.getCompletionStats();
      console.log('📊 Order completion stats:', orderCompletionStats);

      return {
        contactCount: contactCount || 0,
        contactCountWithEmail: contactCountWithEmail || 0,
        contactCountWithPhone: contactCountWithPhone || 0,
        productCount: productCount || 0,
        totalProductCount: totalProductCount || 0,
        orderCount: orderCount || 0,
        orderCompletionStats: orderCompletionStats
      };
    }
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    return {
      contactCount: 0,
      contactCountWithEmail: 0,
      contactCountWithPhone: 0,
      productCount: 0,
      totalProductCount: 0,
      orderCount: 0,
      orderCompletionStats: { complete: 0, incomplete: 0, total: 0 }
    };
  }
}

async function getRecentActivity(userId?: string, userRole?: string) {
  try {
    console.log('📈 Getting recent activity...');

    if (userRole === 'contact' && userId) {
      // Contact users only see their own data
      const recentOrders = await OrderModel.getRecentByUser(userId, 3);
      console.log('🛒 User recent orders:', recentOrders?.length || 0);

      return {
        recentOrders: recentOrders || [],
        recentContacts: [],
        lowStockItems: []
      };
    } else {
      // Admin and other roles see all data
      const recentOrders = await OrderModel.getRecent(3);
      console.log('🛒 Recent orders:', recentOrders?.length || 0);

      const recentContacts = await ContactModel.getAll(3, 0);
      console.log('👥 Recent contacts:', recentContacts?.length || 0);

      const lowStockItems = await InventoryModel.getLowStock(3);
      console.log('📦 Low stock items:', lowStockItems?.length || 0);

      return {
        recentOrders: recentOrders || [],
        recentContacts: recentContacts || [],
        lowStockItems: lowStockItems || []
      };
    }
  } catch (error) {
    console.error('❌ Error getting recent activity:', error);
    return {
      recentOrders: [],
      recentContacts: [],
      lowStockItems: []
    };
  }
}

async function getRevenueData(userRole?: string) {
  try {
    console.log('💰 Getting revenue data...');

    // Only show revenue data to admin/staff users
    if (userRole === 'contact') {
      return [];
    }

    const revenueData = await OrderModel.getRevenueByMonth(12);
    console.log('💰 Revenue data:', revenueData?.length || 0, 'months');
    return revenueData || [];
  } catch (error) {
    console.error('❌ Error getting revenue data:', error);
    return [];
  }
}

async function getOrderCountsData(userRole?: string) {
  try {
    console.log('📊 Getting order counts data...');

    // Only show order counts data to admin/staff users
    if (userRole === 'contact') {
      return [];
    }

    const orderCountsData = await OrderModel.getOrderCountsByStatusAndMonth(12);
    console.log('📊 Order counts data:', orderCountsData?.length || 0, 'records');
    return orderCountsData || [];
  } catch (error) {
    console.error('❌ Error getting order counts data:', error);
    return [];
  }
}

async function getCostBreakdownData(userRole?: string) {
  try {
    console.log('📊 Getting cost breakdown data...');

    // Only show cost breakdown data to admin/staff users
    if (userRole === 'contact') {
      return [];
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByMonth(12);
    console.log('📊 Cost breakdown data:', costBreakdownData?.length || 0, 'records');
    return costBreakdownData || [];
  } catch (error) {
    console.error('❌ Error getting cost breakdown data:', error);
    return [];
  }
}

async function getCostCategories(userRole?: string) {
  try {
    console.log('📊 Getting cost categories...');

    // Only show cost categories to admin/staff users
    if (userRole === 'contact') {
      return [];
    }

    const categories = await CostCategoryModel.getAll();
    console.log('📊 Cost categories:', categories?.length || 0, 'found');
    return categories || [];
  } catch (error) {
    console.error('❌ Error getting cost categories:', error);
    return [];
  }
}

export default async function DashboardPage() {
  console.log('🏠 Loading dashboard page...');

  let profile, stats, activity, revenueData, orderCountsData, costBreakdownData, costCategories;

  try {
    profile = await getUserProfile();
    console.log('👤 User profile loaded:', profile ? 'Yes' : 'No');

    stats = await getStats(profile?.id, profile?.role || undefined);
    activity = await getRecentActivity(profile?.id, profile?.role || undefined);
    revenueData = await getRevenueData(profile?.role || undefined);
    orderCountsData = await getOrderCountsData(profile?.role || undefined);
    costBreakdownData = await getCostBreakdownData(profile?.role || undefined);
    costCategories = await getCostCategories(profile?.role || undefined);

    console.log('✅ Dashboard data loaded successfully');
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    // Return a simple error page
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
          <p className="text-gray-600">There was an error loading the dashboard. Please check the console for details.</p>
        </div>
      </div>
    );
  }

  // Combine recent activities and sort by date
  const allActivities = [
    ...activity.recentOrders.map(order => ({
      type: 'order',
      id: order.id,
      title: `${isContact(profile?.role) ? 'Order' : 'New Order' } #${order.id.substring(0, 8)}`,
      status: order.status,
      name: order.contact_name || 'Unknown Contact',
      date: new Date(order.created_at),
      statusColor: order.status === 'completed' ? 'green' : 'blue'
    })),
    ...activity.recentContacts.map(contact => ({
      type: 'contact',
      id: contact.id,
      title: 'New Contact Registration',
      status: 'new',
      name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact',
      date: new Date(contact.created_at),
      statusColor: 'blue'
    })),
    ...activity.lowStockItems.map(item => ({
      type: 'inventory',
      id: item.id,
      title: 'Inventory Alert',
      status: 'alert',
      name: `${item.product_name || 'Unknown Product'} - Low Stock (${item.quantity}/${item.min_quantity})`,
      date: new Date(item.updated_at),
      statusColor: 'yellow'
    })),

  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  // Calculate current month revenue and growth
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const currentMonthData = revenueData.find(item => item.month === currentMonth);
  const currentMonthRevenue = currentMonthData?.revenue || 0;

  // Calculate previous month for comparison
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);
  const prevMonthData = revenueData.find(item => item.month === prevMonthStr);
  const prevMonthRevenue = prevMonthData?.revenue || 0;

  // Calculate growth percentage
  const growthPercentage = prevMonthRevenue > 0
    ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100)
    : 0;
  const isPositiveGrowth = growthPercentage >= 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome{profile ? `, ${profile.first_name}` : ''} to your Payoff Solar dashboard.
        {isContact(profile?.role)
          ? "Here's an overview of your orders."
          : "Here&apos;s an overview of your business."
        }
      </p>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Show different stats based on user role */}
        {!isContact(profile?.role) && (
          <>
            {/* Contacts - Admin/Staff only */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <FaUsers className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{(stats.contactCount || 0).toLocaleString()}</div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>With Email:</span>
                            <span className="font-medium">
                              {(stats.contactCountWithEmail || 0).toLocaleString()}
                              {stats.contactCount > 0 && (
                                <span className="text-gray-500 ml-1">
                                  ({Math.round(((stats.contactCountWithEmail || 0) / stats.contactCount) * 100)}%)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>With Phone:</span>
                            <span className="font-medium">
                              {(stats.contactCountWithPhone || 0).toLocaleString()}
                              {stats.contactCount > 0 && (
                                <span className="text-gray-500 ml-1">
                                  ({Math.round(((stats.contactCountWithPhone || 0) / stats.contactCount) * 100)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/dashboard/contacts" className="font-medium text-green-600 hover:text-green-500">
                    View all contacts
                  </Link>
                </div>
              </div>
            </div>

            {/* Products - Admin/Staff only */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <FaBoxes className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{(stats.totalProductCount || 0).toLocaleString()}</div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Active Products:</span>
                            <span className="font-medium">
                              {(stats.productCount || 0).toLocaleString()} ({stats.totalProductCount > 0 ? Math.round(((stats.productCount || 0) / stats.totalProductCount) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inactive Products:</span>
                            <span className="font-medium">
                              {((stats.totalProductCount || 0) - (stats.productCount || 0)).toLocaleString()} ({stats.totalProductCount > 0 ? Math.round((((stats.totalProductCount || 0) - (stats.productCount || 0)) / stats.totalProductCount) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/dashboard/products" className="font-medium text-blue-600 hover:text-blue-500">
                    View all products
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Orders - All users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FaShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isContact(profile?.role) ? 'My Orders' : 'Total Orders' }
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.orderCount.toLocaleString()}</div>
                    {stats.orderCompletionStats && stats.orderCompletionStats.total > 0 && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Complete:</span>
                          <span className="font-medium text-green-600">
                            {stats.orderCompletionStats.complete.toLocaleString()} ({Math.round((stats.orderCompletionStats.complete / stats.orderCompletionStats.total) * 100)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incomplete:</span>
                          <span className="font-medium text-orange-600">
                            {stats.orderCompletionStats.incomplete.toLocaleString()} ({Math.round((stats.orderCompletionStats.incomplete / stats.orderCompletionStats.total) * 100)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/dashboard/orders" className="font-medium text-purple-600 hover:text-purple-500">
                {isContact(profile?.role) ? 'View my orders' : 'View all orders' }
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Activity</h2>
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {allActivities.length > 0 ? (
            allActivities.map((activity) => (
              <li key={`${activity.type}-${activity.id}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-600 truncate">{activity.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${activity.statusColor}-100 text-${activity.statusColor}-800`}>
                        {activity.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {activity.name}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {formatDistanceToNow(activity.date, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li>
              <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No recent activity
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Sales Overview */}
      {!isContact(profile?.role) && (
        <>
          <h2 className="mt-8 text-lg font-medium text-gray-900">Sales Overview</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Revenue (Complete Orders)</h3>
                <div className="mt-2 flex items-center">
                  <div className="text-3xl font-semibold text-gray-900">
                    ${currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  {prevMonthRevenue > 0 && (
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositiveGrowth ? (
                        <FaArrowUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      ) : (
                        <FaArrowDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-1">{Math.abs(growthPercentage).toFixed(1)}%</span>
                      <span className="ml-1 text-gray-500">from last month</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <RevenueChart data={revenueData} />
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Count by Status</h3>
                <div className="mt-4">
                  <OrderCountsChart data={orderCountsData} />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown Chart */}
          <div className="mt-5">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Cost Breakdown by Month (Complete Orders)</h3>
                <div className="mt-4">
                  <CostBreakdownChart data={costBreakdownData} categories={costCategories} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
