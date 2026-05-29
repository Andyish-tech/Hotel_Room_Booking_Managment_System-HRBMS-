import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalCustomers: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [roomsRes, customersRes, bookingsRes, paymentsRes] = await Promise.all([
        axios.get('/rooms'),
        axios.get('/customers'),
        axios.get('/bookings'),
        axios.get('/payments'),
      ]);

      const rooms = roomsRes.data.data || [];
      const customers = customersRes.data.data || [];
      const bookings = bookingsRes.data.data || [];
      const payments = paymentsRes.data.data || [];

      const totalRevenue = payments.reduce(
        (sum, p) => sum + parseFloat(p.AmountPaid || 0), 
        0
      );

      setStats({
        totalRooms: rooms.length,
        availableRooms: rooms.filter(r => r.RoomStatus === 'Available').length,
        occupiedRooms: rooms.filter(r => r.RoomStatus === 'Occupied').length,
        totalCustomers: customers.length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => new Date(b.CheckOutDate) >= new Date()).length,
        totalRevenue,
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Occupied Rooms',
      value: stats.occupiedRooms,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Revenue',        value: `${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw`,
        color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Maintenance',
      value: stats.totalRooms - stats.availableRooms - stats.occupiedRooms,
      color: 'bg-brand',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-600 to-brand rounded-2xl p-6 text-black shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-black">
              Welcome back, {user?.FullName}!
            </h2>
            <p className="text-black/70">
              Here's what's happening at Golden Stay Hotel today.
            </p>
          </div>
          <div className="hidden sm:block">
            <svg className="w-20 h-20 text-white/20 opacity-30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-black">{stat.title}</p>
              <p className="text-2xl font-bold text-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">Recent Bookings</h3>              <span className="text-sm text-black">Latest 5 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-left">Check In</th>
                <th className="px-4 py-3 text-left">Check Out</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <tr key={booking.BookingID} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium">{booking.CustomerName}</td>
                    <td className="table-cell">{booking.RoomNumber} - {booking.RoomType}</td>
                    <td className="table-cell">{new Date(booking.CheckInDate).toLocaleDateString()}</td>
                    <td className="table-cell">{new Date(booking.CheckOutDate).toLocaleDateString()}</td>
                    <td className="table-cell">
                      {new Date(booking.CheckOutDate) >= new Date() ? (
                        <span className="badge-success">Active</span>
                      ) : (
                        <span className="badge-info">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>                    <td colSpan="5" className="px-4 py-8 text-center text-black">
                    No bookings found. Start by adding a new booking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
