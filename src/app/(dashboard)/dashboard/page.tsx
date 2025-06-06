import React from 'react';
import Link from 'next/link';
import { FaUsers, FaBoxes, FaShoppingCart, FaFileInvoiceDollar, FaWarehouse, FaEdit, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getUserProfile, isAdmin, isCustomer } from '@/lib/auth';
import { CustomerModel, ProductModel, OrderModel, InventoryModel, InvoiceModel } from '@/lib/models';
import { formatDistanceToNow, format } from 'date-fns';

async function getStats(userId?: string, userRole?: string) {
  try {
    console.log('📊 Getting dashboard stats...');

    if (userRole === 'customer' && userId) {
      // Customer users only see their own data
      const orderCount = await OrderModel.getCountByUser(userId);
      const invoiceCount = await InvoiceModel.getCountByUser(userId);
      console.log('🛒 User order count:', orderCount);
      console.log('📄 User invoice count:', invoiceCount);

      return {
        orderCount: orderCount || 0,
        invoiceCount: invoiceCount || 0
      };
    } else {
      // Admin and other roles see all data
      const customerCount = await CustomerModel.getCount();
      console.log('👥 Customer count:', customerCount);

      const productCount = await ProductModel.getCount();
      console.log('📦 Product count:', productCount);

      const orderCount = await OrderModel.getCount();
      console.log('🛒 Order count:', orderCount);

      const invoiceCount = await InvoiceModel.getCount();
      console.log('📄 Invoice count:', invoiceCount);

      return {
        customerCount: customerCount || 0,
        productCount: productCount || 0,
        orderCount: orderCount || 0,
        invoiceCount: invoiceCount || 0
      };
    }
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    return {
      customerCount: 0,
      productCount: 0,
      orderCount: 0,
      invoiceCount: 0
    };
  }
}

async function getRecentActivity(userId?: string, userRole?: string) {
  try {
    console.log('📈 Getting recent activity...');

    if (userRole === 'customer' && userId) {
      // Customer users only see their own data
      const recentOrders = await OrderModel.getRecentByUser(userId, 3);
      console.log('🛒 User recent orders:', recentOrders?.length || 0);

      const recentInvoices = await InvoiceModel.getRecentByUser(userId, 3);
      console.log('📄 User recent invoices:', recentInvoices?.length || 0);

      return {
        recentOrders: recentOrders || [],
        recentInvoices: recentInvoices || [],
        recentCustomers: [],
        lowStockItems: []
      };
    } else {
      // Admin and other roles see all data
      const recentOrders = await OrderModel.getRecent(3);
      console.log('🛒 Recent orders:', recentOrders?.length || 0);

      const recentCustomers = await CustomerModel.getAll(3, 0);
      console.log('👥 Recent customers:', recentCustomers?.length || 0);

      const lowStockItems = await InventoryModel.getLowStock(3);
      console.log('📦 Low stock items:', lowStockItems?.length || 0);

      const recentInvoices = await InvoiceModel.getRecent(3);
      console.log('📄 Recent invoices:', recentInvoices?.length || 0);

      return {
        recentOrders: recentOrders || [],
        recentCustomers: recentCustomers || [],
        lowStockItems: lowStockItems || [],
        recentInvoices: recentInvoices || []
      };
    }
  } catch (error) {
    console.error('❌ Error getting recent activity:', error);
    return {
      recentOrders: [],
      recentCustomers: [],
      lowStockItems: [],
      recentInvoices: []
    };
  }
}

export default async function DashboardPage() {
  console.log('🏠 Loading dashboard page...');

  let profile, stats, activity;

  try {
    profile = await getUserProfile();
    console.log('👤 User profile loaded:', profile ? 'Yes' : 'No');

    stats = await getStats(profile?.id, profile?.role || undefined);
    activity = await getRecentActivity(profile?.id, profile?.role || undefined);

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
      title: `${isCustomer(profile?.role) ? 'Order' : 'New Order'} #${order.id.substring(0, 8)}`,
      status: order.status,
      name: order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : 'Unknown Customer',
      date: new Date(order.created_at),
      statusColor: order.status === 'completed' ? 'green' : 'blue'
    })),
    ...activity.recentCustomers.map(customer => ({
      type: 'customer',
      id: customer.id,
      title: 'New Customer Registration',
      status: 'new',
      name: `${customer.first_name} ${customer.last_name}`,
      date: new Date(customer.created_at),
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
    ...(activity.recentInvoices || []).map(invoice => ({
      type: 'invoice',
      id: invoice.id,
      title: `${isCustomer(profile?.role) ? 'Invoice' : 'New Invoice'} #${invoice.invoice_number}`,
      status: invoice.status,
      name: invoice.customer_first_name && invoice.customer_last_name
        ? `${invoice.customer_first_name} ${invoice.customer_last_name}`
        : 'Unknown Customer',
      date: new Date(invoice.created_at),
      statusColor: invoice.status === 'paid' ? 'green' : invoice.status === 'overdue' ? 'red' : 'yellow'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome{profile ? `, ${profile.first_name}` : ''} to your Payoff Solar dashboard.
        {isCustomer(profile?.role)
          ? "Here's an overview of your orders and invoices."
          : "Here's an overview of your business."
        }
      </p>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Show different stats based on user role */}
        {!isCustomer(profile?.role) && (
          <>
            {/* Customers - Admin/Staff only */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <FaUsers className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{(stats.customerCount || 0).toLocaleString()}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/dashboard/customers" className="font-medium text-green-600 hover:text-green-500">
                    View all customers
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
                        <div className="text-lg font-medium text-gray-900">{(stats.productCount || 0).toLocaleString()}</div>
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
                    {isCustomer(profile?.role) ? 'My Orders' : 'Total Orders'}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.orderCount.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/dashboard/orders" className="font-medium text-purple-600 hover:text-purple-500">
                {isCustomer(profile?.role) ? 'View my orders' : 'View all orders'}
              </Link>
            </div>
          </div>
        </div>

        {/* Invoices - All users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <FaFileInvoiceDollar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {isCustomer(profile?.role) ? 'My Invoices' : 'Total Invoices'}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{(stats.invoiceCount || 0).toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/dashboard/invoices" className="font-medium text-orange-600 hover:text-orange-500">
                {isCustomer(profile?.role) ? 'View my invoices' : 'View all invoices'}
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
      <h2 className="mt-8 text-lg font-medium text-gray-900">Sales Overview</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Revenue</h3>
            <div className="mt-2 flex items-center">
              <div className="text-3xl font-semibold text-gray-900">$24,567</div>
              <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                <FaArrowUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                <span className="ml-1">12%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </div>
            <div className="mt-4 h-24 bg-gray-100 rounded-md">
              {/* Placeholder for chart */}
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Revenue Chart Placeholder
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Orders This Month</h3>
            <div className="mt-2 flex items-center">
              <div className="text-3xl font-semibold text-gray-900">156</div>
              <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                <FaArrowDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                <span className="ml-1">4%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </div>
            <div className="mt-4 h-24 bg-gray-100 rounded-md">
              {/* Placeholder for chart */}
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Orders Chart Placeholder
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
