import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidPositiveNumber, isValidDate, isDateBefore, isTodayOrFuture, validate, hasErrors } from '../utils/validation';
import Pagination from '../Components/Pagination';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    CheckInDate: '',
    CheckOutDate: '',
    NumberOfDays: 1,
    RoomNumber: '',
    CustomerID: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [bookingsRes, roomsRes, customersRes] = await Promise.all([
        axios.get('/bookings'),
        axios.get('/rooms'),
        axios.get('/customers'),
      ]);
      setBookings(bookingsRes.data.data || []);
      setRooms(roomsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search by customer name or room number
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const customerName = (b.CustomerName || '').toLowerCase();
        const roomNumber = (b.RoomNumber || '').toLowerCase();
        if (!customerName.includes(q) && !roomNumber.includes(q)) return false;
      }
      // Status filter
      if (filterStatus) {
        const today = new Date();
        const checkIn = new Date(b.CheckInDate);
        const checkOut = new Date(b.CheckOutDate);
        let status;
        if (today > checkOut) status = 'Completed';
        else if (today >= checkIn && today <= checkOut) status = 'Active';
        else status = 'Upcoming';
        if (status !== filterStatus) return false;
      }
      // Date range filter
      if (filterDateFrom) {
        const checkIn = new Date(b.CheckInDate);
        const from = new Date(filterDateFrom);
        if (checkIn < from) return false;
      }
      if (filterDateTo) {
        const checkOut = new Date(b.CheckOutDate);
        const to = new Date(filterDateTo);
        if (checkOut > to) return false;
      }
      return true;
    });
  }, [bookings, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  // Paginated bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage]);

  // Reset to page 1 when filters change, or clamp if current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  const validateForm = (data) => {
    const rules = {
      CheckInDate: [
        { validate: (v) => isRequired(v), message: 'Check-in date is required' },
        { validate: (v) => isValidDate(v), message: 'Enter a valid check-in date' },
        {
          validate: (v) => isTodayOrFuture(v),
          message: 'Check-in date must be today or a future date',
        },
      ],
      CheckOutDate: [
        { validate: (v) => isRequired(v), message: 'Check-out date is required' },
        { validate: (v) => isValidDate(v), message: 'Enter a valid check-out date' },
        {
          validate: (v, d) => !d.CheckInDate || !v || isDateBefore(d.CheckInDate, v),
          message: 'Check-out date must be after check-in date',
        },
      ],
      NumberOfDays: [
        { validate: (v) => isRequired(v), message: 'Number of days is required' },
        { validate: (v) => isValidPositiveNumber(v), message: 'Must be a valid positive number' },
        { validate: (v) => parseInt(v) > 0, message: 'Minimum stay is 1 day' },
      ],
      RoomNumber: [
        { validate: (v) => isRequired(v), message: 'Please select a room' },
      ],
      CustomerID: [
        { validate: (v) => isRequired(v), message: 'Please select a customer' },
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

  const resetForm = () => {
    setFormData({
      CheckInDate: '',
      CheckOutDate: '',
      NumberOfDays: 1,
      RoomNumber: '',
      CustomerID: '',
    });
    setEditingBooking(null);
    setErrors({});
    setTouched({});
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'CheckInDate' || name === 'CheckOutDate') {
        if (updated.CheckInDate && updated.CheckOutDate) {
          const start = new Date(updated.CheckInDate);
          const end = new Date(updated.CheckOutDate);
          const diffTime = end - start;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updated.NumberOfDays = diffDays > 0 ? diffDays : 1;
        }
      }

      return updated;
    });

    // Clear error when user changes value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      CheckInDate: booking.CheckInDate?.split('T')[0] || booking.CheckInDate,
      CheckOutDate: booking.CheckOutDate?.split('T')[0] || booking.CheckOutDate,
      NumberOfDays: booking.NumberOfDays,
      RoomNumber: booking.RoomNumber,
      CustomerID: booking.CustomerID,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setTouched({ CheckInDate: true, CheckOutDate: true, NumberOfDays: true, RoomNumber: true, CustomerID: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    try {
      const payload = {
        ...formData,
        CheckInDate: formData.CheckInDate,
        CheckOutDate: formData.CheckOutDate,
        NumberOfDays: parseInt(formData.NumberOfDays),
        CustomerID: parseInt(formData.CustomerID),
      };

      if (editingBooking) {
        const response = await axios.put(`/bookings/${editingBooking.BookingID}`, payload);
        if (response.data.success) {
          showSuccess('Booking updated successfully!');
          resetForm();
          fetchAllData();
        }
      } else {
        const response = await axios.post('/bookings', payload);
        if (response.data.success) {
          showSuccess('Booking created successfully!');
          resetForm();
          fetchAllData();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      showError(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const response = await axios.delete(`/bookings/${id}`);
      if (response.data.success) {
        showSuccess('Booking deleted successfully!');
        fetchAllData();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete booking';
      showError(message);
    }
  };

  const getBookingStatus = (booking) => {
    const today = new Date();
    const checkIn = new Date(booking.CheckInDate);
    const checkOut = new Date(booking.CheckOutDate);
    if (today > checkOut) return { label: 'Completed', badge: 'badge-info' };
    if (today >= checkIn && today <= checkOut) return { label: 'Active', badge: 'badge-success' };
    return { label: 'Upcoming', badge: 'badge-warning' };
  };

  const calcDays = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterStatus || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Booking Management</h2>
          <p className="text-black mt-1">Create, update, and manage room bookings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </>
          )}
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">
            {editingBooking ? 'Edit Booking' : 'Create New Booking'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Check-In Date</label>
              <input
                type="date"
                name="CheckInDate"
                value={formData.CheckInDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.CheckInDate && errors.CheckInDate ? 'border-red-500' : ''}`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {touched.CheckInDate && errors.CheckInDate && (
                <p className="text-red-500 text-xs mt-1">{errors.CheckInDate}</p>
              )}
            </div>
            <div>
              <label className="form-label">Check-Out Date</label>
              <input
                type="date"
                name="CheckOutDate"
                value={formData.CheckOutDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.CheckOutDate && errors.CheckOutDate ? 'border-red-500' : ''}`}
                required
              />
              {touched.CheckOutDate && errors.CheckOutDate && (
                <p className="text-red-500 text-xs mt-1">{errors.CheckOutDate}</p>
              )}
            </div>
            <div>
              <label className="form-label">Number of Days</label>
              <input
                type="number"
                name="NumberOfDays"
                value={formData.NumberOfDays}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.NumberOfDays && errors.NumberOfDays ? 'border-red-500' : ''}`}
                min="1"
                required
              />
              {touched.NumberOfDays && errors.NumberOfDays && (
                <p className="text-red-500 text-xs mt-1">{errors.NumberOfDays}</p>
              )}
            </div>
            <div>
              <label className="form-label">Room</label>
              <select
                name="RoomNumber"
                value={formData.RoomNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.RoomNumber && errors.RoomNumber ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room.RoomNumber} value={room.RoomNumber}>
                    {room.RoomNumber} - {room.RoomType} [{room.RoomStatus}]
                  </option>
                ))}
              </select>
              {touched.RoomNumber && errors.RoomNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.RoomNumber}</p>
              )}
            </div>
            <div>
              <label className="form-label">Customer</label>
              <select
                name="CustomerID"
                value={formData.CustomerID}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.CustomerID && errors.CustomerID ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.CustomerID} value={customer.CustomerID}>
                    {customer.FullName} - {customer.PhoneNumber}
                  </option>
                ))}
              </select>
              {touched.CustomerID && errors.CustomerID && (
                <p className="text-red-500 text-xs mt-1">{errors.CustomerID}</p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editingBooking ? 'Update Booking' : 'Create Booking'}
              </button>
              {editingBooking && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              placeholder="Customer or room..."
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
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

      {/* Bookings Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            Bookings ({filteredBookings.length})
          </h3>
          {hasActiveFilters && (              <span className="text-sm text-black">
              Filtered from {bookings.length} total
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
                <th className="px-6 py-3 text-left">Check In</th>
                <th className="px-6 py-3 text-left">Check Out</th>
                <th className="px-6 py-3 text-left">Days</th>
                <th className="px-6 py-3 text-left">Total Amount</th>
                <th className="px-6 py-3 text-left">Amount Paid</th>
                <th className="px-6 py-3 text-left">Remaining</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking) => (
                  <tr key={booking.BookingID} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium text-black">#{booking.BookingID}</td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-black">{booking.CustomerName}</p>
                        <p className="text-xs text-black">{booking.PhoneNumber}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{booking.RoomNumber}</span>
                      <span className="text-xs text-black ml-1">({booking.RoomType})</span>
                    </td>
                    <td className="table-cell">{new Date(booking.CheckInDate).toLocaleDateString()}</td>
                    <td className="table-cell">{new Date(booking.CheckOutDate).toLocaleDateString()}</td>
                    <td className="table-cell">{calcDays(booking.CheckInDate, booking.CheckOutDate)}</td>
                    <td className="table-cell font-semibold text-black">
                      {parseFloat(booking.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                    </td>
                    <td className="table-cell text-black">
                      {parseFloat(booking.AmountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        parseFloat(booking.RemainingBalance || 0) > 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {parseFloat(booking.RemainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Frw
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={getBookingStatus(booking).badge}>
                        {getBookingStatus(booking).label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(booking)}
                          className="p-2 text-black hover:bg-yellow-200 rounded-lg transition-colors"
                          title="Edit Booking"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(booking.BookingID)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Booking"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-black">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No bookings match your filters. <button onClick={clearFilters} className="text-black underline">Clear filters</button></p>
                      </div>
                    ) : (
                      'No bookings found. Create your first booking!'
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
          totalItems={filteredBookings.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Bookings;
