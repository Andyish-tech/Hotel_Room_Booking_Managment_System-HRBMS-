import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidPositiveNumber, isValidDate, validate, hasErrors } from '../utils/validation';
import Pagination from '../Components/Pagination';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    AmountPaid: '',
    PaymentDate: new Date().toISOString().split('T')[0],
    BookingID: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedBookingInfo, setSelectedBookingInfo] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        axios.get('/payments'),
        axios.get('/bookings'),
      ]);
      setPayments(paymentsRes.data.data || []);
      setBookings(bookingsRes.data.data || []);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search by customer name or room number
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (p.CustomerName || '').toLowerCase();
        const room = (p.RoomNumber || '').toLowerCase();
        if (!name.includes(q) && !room.includes(q)) return false;
      }
      // Date range filter
      if (filterDateFrom) {
        const payDate = new Date(p.PaymentDate);
        const from = new Date(filterDateFrom);
        if (payDate < from) return false;
      }
      if (filterDateTo) {
        const payDate = new Date(p.PaymentDate);
        // Set to end of day for inclusive filter
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (payDate > to) return false;
      }
      return true;
    });
  }, [payments, searchQuery, filterDateFrom, filterDateTo]);

  // Paginated payments
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  // Reset to page 1 when filters change, or clamp if current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDateFrom, filterDateTo]);

  const filteredTotalRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + parseFloat(p.AmountPaid || 0), 0);
  }, [filteredPayments]);

  const validateForm = (data) => {
    const rules = {
      AmountPaid: [
        { validate: (v) => isRequired(v), message: 'Amount is required' },
        { validate: (v) => isValidPositiveNumber(v), message: 'Enter a valid positive amount' },
        { validate: (v) => parseFloat(v) > 0, message: 'Amount must be greater than 0' },
      ],
      PaymentDate: [
        { validate: (v) => isRequired(v), message: 'Payment date is required' },
        { validate: (v) => isValidDate(v), message: 'Enter a valid date' },
      ],
      BookingID: [
        { validate: (v) => isRequired(v), message: 'Please select a booking' },
      ],
    };
    return validate(rules, data);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validateForm(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || null }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user changes value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // When a booking is selected, find and show its payment info
    if (name === 'BookingID' && value) {
      const booking = bookings.find(b => b.BookingID === parseInt(value));
      if (booking) {
        setSelectedBookingInfo({
          CustomerName: booking.CustomerName,
          RoomNumber: booking.RoomNumber,
          RoomType: booking.RoomType,
          TotalAmount: parseFloat(booking.TotalAmount || 0),
          AmountPaid: parseFloat(booking.AmountPaid || 0),
          RemainingBalance: parseFloat(booking.RemainingBalance || 0),
          NumberOfDays: booking.NumberOfDays,
          CheckInDate: booking.CheckInDate,
          CheckOutDate: booking.CheckOutDate,
        });
      }
    } else if (name === 'BookingID' && !value) {
      setSelectedBookingInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setTouched({ AmountPaid: true, PaymentDate: true, BookingID: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    try {
      const payload = {
        ...formData,
        AmountPaid: parseFloat(formData.AmountPaid),
        BookingID: parseInt(formData.BookingID),
      };

      const response = await axios.post('/payments', payload);
      if (response.data.success) {
        showSuccess('Payment recorded successfully!');
        setShowForm(false);
        setFormData({
          AmountPaid: '',
          PaymentDate: new Date().toISOString().split('T')[0],
          BookingID: '',
        });
        setErrors({});
        setTouched({});
        setSelectedBookingInfo(null);
        fetchAllData();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to record payment';
      showError(message);
    }
  };

  const totalRevenue = payments.reduce(
    (sum, p) => sum + parseFloat(p.AmountPaid || 0), 
    0
  );

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Payment Management</h2>
          <p className="text-black mt-1">Record and track customer payments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </>
          )}
        </button>
      </div>

      {/* Revenue Summary (filtered) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="bg-brand p-3 rounded-lg text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-black">
              {hasActiveFilters ? 'Filtered Revenue' : 'Total Revenue'}
            </p>
            <p className="text-2xl font-bold text-black">
              {filteredTotalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="bg-brand p-3 rounded-lg text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-black">Total Transactions</p>
            <p className="text-2xl font-bold text-black">{filteredPayments.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="bg-brand p-3 rounded-lg text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-black">Average Payment</p>
            <p className="text-2xl font-bold text-black">
              {filteredPayments.length > 0 
                ? (filteredTotalRevenue / filteredPayments.length).toLocaleString('en-US', { minimumFractionDigits: 2 }) 
                : '0.00'} Frw
            </p>
          </div>
        </div>
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">Record New Payment</h3>
          
          {/* Bill Summary Card - shown when a booking is selected */}
          {selectedBookingInfo && (
            <div className="mb-6 border-2 border-brand rounded-xl p-5 bg-yellow-50">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <h4 className="font-bold text-black text-base">
                  Booking #{formData.BookingID} - Bill Summary
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold">Customer</p>
                  <p className="font-semibold text-black">{selectedBookingInfo.CustomerName}</p>
                </div>
                <div>
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold">Room</p>
                  <p className="font-semibold text-black">{selectedBookingInfo.RoomNumber} ({selectedBookingInfo.RoomType})</p>
                </div>
                <div>
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold">Stay Duration</p>
                  <p className="font-semibold text-black">
                    {new Date(selectedBookingInfo.CheckInDate).toLocaleDateString()} - {new Date(selectedBookingInfo.CheckOutDate).toLocaleDateString()} 
                    ({selectedBookingInfo.NumberOfDays} day{selectedBookingInfo.NumberOfDays > 1 ? 's' : ''})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold">Rate Per Day</p>
                  <p className="font-semibold text-black">25,000.00 Frw</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-brand/30 pt-4">
                <div className="text-center p-3 bg-white rounded-lg border border-brand/20">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Total Amount Due</p>
                  <p className="text-xl font-bold text-black">
                    {selectedBookingInfo.TotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-brand/20">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Already Paid</p>
                  <p className="text-xl font-bold text-green-700">
                    {selectedBookingInfo.AmountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-brand/20">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Remaining Balance</p>
                  <p className={`text-xl font-bold ${
                    selectedBookingInfo.RemainingBalance > 0 ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {selectedBookingInfo.RemainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                  </p>
                  {selectedBookingInfo.RemainingBalance <= 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 mt-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Fully Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Amount Paid (Frw)</label>                <input
                  type="number"
                  name="AmountPaid"
                  value={formData.AmountPaid}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${touched.AmountPaid && errors.AmountPaid ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              {touched.AmountPaid && errors.AmountPaid && (
                <p className="text-red-500 text-xs mt-1">{errors.AmountPaid}</p>
              )}
            </div>
            <div>
              <label className="form-label">Payment Date</label>                <input
                  type="date"
                  name="PaymentDate"
                  value={formData.PaymentDate}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${touched.PaymentDate && errors.PaymentDate ? 'border-red-500' : ''}`}
                  required
                />
              {touched.PaymentDate && errors.PaymentDate && (
                <p className="text-red-500 text-xs mt-1">{errors.PaymentDate}</p>
              )}
            </div>
            <div>
              <label className="form-label">Booking</label>
              <select
                name="BookingID"
                value={formData.BookingID}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.BookingID && errors.BookingID ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Booking</option>
                {bookings.map(booking => (
                  <option key={booking.BookingID} value={booking.BookingID}>
                    #{booking.BookingID} - {booking.CustomerName} (Room {booking.RoomNumber})
                  </option>
                ))}
              </select>
              {touched.BookingID && errors.BookingID && (
                <p className="text-red-500 text-xs mt-1">{errors.BookingID}</p>
              )}
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="btn-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Customer or room..."
              />
            </div>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary text-sm flex items-center gap-1 w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            Payments ({filteredPayments.length})
          </h3>
          {hasActiveFilters && (
            <span className="text-sm text-black">
              Filtered from {payments.length} total
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Room</th>
                <th className="px-6 py-3 text-left">Amount Paid</th>
                <th className="px-6 py-3 text-left">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr key={payment.PaymentID} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium text-black">#{payment.PaymentID}</td>
                    <td className="table-cell font-medium">{payment.CustomerName}</td>
                    <td className="table-cell">{payment.RoomNumber} ({payment.RoomType})</td>
                    <td className="table-cell">
                      <span className="font-semibold text-black">
                        {parseFloat(payment.AmountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                      </span>
                    </td>
                    <td className="table-cell">{new Date(payment.PaymentDate).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-black">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No payments match your filters. <button onClick={clearFilters} className="text-black underline">Clear filters</button></p>
                      </div>
                    ) : (
                      'No payments recorded yet.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Payments;
