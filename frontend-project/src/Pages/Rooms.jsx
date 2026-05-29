import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, validate, hasErrors } from '../utils/validation';
import Pagination from '../Components/Pagination';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    RoomNumber: '',
    RoomType: '',
    RoomStatus: 'Available',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const roomTypes = ['Single', 'Double', 'Suite', 'Deluxe Suite', 'Penthouse'];
  const roomStatuses = ['Available', 'Occupied', 'Under Maintenance', 'Reserved'];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/rooms');
      setRooms(response.data.data || []);
    } catch (error) {
      showError('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Search query filter (by room number)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!room.RoomNumber.toLowerCase().includes(q)) return false;
      }
      // Room type filter
      if (filterType && room.RoomType !== filterType) return false;
      // Room status filter
      if (filterStatus && room.RoomStatus !== filterStatus) return false;
      return true;
    });
  }, [rooms, searchQuery, filterType, filterStatus]);

  // Paginated rooms
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRooms.slice(start, start + itemsPerPage);
  }, [filteredRooms, currentPage]);

  // Reset to page 1 when filters change, or clamp if current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  const validateForm = (data) => {
    const rules = {
      RoomNumber: [
        { validate: (v) => isRequired(v), message: 'Room number is required' },
        { validate: (v) => !v || v.trim().length >= 1, message: 'Enter a valid room number' },
      ],
      RoomType: [
        { validate: (v) => isRequired(v), message: 'Room type is required' },
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setTouched({ RoomNumber: true, RoomType: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    try {
      const response = await axios.post('/rooms', formData);
      if (response.data.success) {
        showSuccess('Room added successfully!');
        setShowForm(false);
        setFormData({ RoomNumber: '', RoomType: '', RoomStatus: 'Available' });
        fetchRooms();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add room';
      showError(message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return 'badge-success';
      case 'Occupied': return 'badge-danger';
      case 'Under Maintenance': return 'badge-warning';
      case 'Reserved': return 'badge-info';
      default: return 'badge-info';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterType || filterStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Room Management</h2>
          <p className="text-black mt-1">Add and manage hotel rooms</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Room
            </>
          )}
        </button>
      </div>

      {/* Add Room Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">Add New Room</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Room Number</label>
              <input
                type="text"
                name="RoomNumber"
                value={formData.RoomNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.RoomNumber && errors.RoomNumber ? 'border-red-500' : ''}`}
                placeholder="e.g., 101"
                required
              />
              {touched.RoomNumber && errors.RoomNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.RoomNumber}</p>
              )}
            </div>
            <div>
              <label className="form-label">Room Type</label>                <select
                name="RoomType"
                value={formData.RoomType}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.RoomType && errors.RoomType ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Type</option>
                {roomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {touched.RoomType && errors.RoomType && (
                <p className="text-red-500 text-xs mt-1">{errors.RoomType}</p>
              )}
            </div>
            <div>
              <label className="form-label">Room Status</label>
              <select
                name="RoomStatus"
                value={formData.RoomStatus}
                onChange={handleInputChange}
                className="input-field"
              >
                {roomStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="btn-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="form-label">Search Room</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              placeholder="Search by room number..."
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="form-label">Room Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="form-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {roomStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm flex items-center gap-1 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Rooms Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            Rooms ({filteredRooms.length})
          </h3>
          {hasActiveFilters && (
            <span className="text-sm text-black">
              Filtered from {rooms.length} total
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Room Number</th>
                <th className="px-6 py-3 text-left">Room Type</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedRooms.length > 0 ? (
                paginatedRooms.map((room) => (
                  <tr key={room.RoomNumber} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium">{room.RoomNumber}</td>
                    <td className="table-cell">
                      <span className="px-3 py-1 bg-brand text-black rounded-full text-xs font-medium">
                        {room.RoomType}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadge(room.RoomStatus)}>
                        {room.RoomStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-black">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No rooms match your filters. <button onClick={clearFilters} className="text-black underline">Clear filters</button></p>
                      </div>
                    ) : (
                      'No rooms found. Add your first room!'
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
          totalItems={filteredRooms.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Rooms;
