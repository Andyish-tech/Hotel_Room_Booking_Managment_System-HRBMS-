import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidName, isValidPhone, validate, hasErrors } from '../utils/validation';
import Pagination from '../Components/Pagination';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    FullName: '',
    PhoneNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      showError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.FullName.toLowerCase().includes(q) ||
        c.PhoneNumber.toLowerCase().includes(q) ||
        String(c.CustomerID).includes(q)
    );
  }, [customers, searchQuery]);

  // Paginated customers
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  // Reset to page 1 when search changes, or clamp if current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const validateForm = (data) => {
    const rules = {
      FullName: [
        { validate: (v) => isRequired(v), message: 'Full name is required' },
        { validate: (v) => isValidName(v), message: 'Name cannot contain numbers or special characters' },
        { validate: (v) => !v || v.trim().length >= 2, message: 'Name must be at least 2 characters' },
      ],
      PhoneNumber: [
        { validate: (v) => isRequired(v), message: 'Phone number is required' },
        { validate: (v) => isValidPhone(v), message: 'Enter a valid phone number (e.g., +250 78X XXX XXX)' },
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    // Mark all fields as touched
    setTouched({ FullName: true, PhoneNumber: true });

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    try {
      const response = await axios.post('/customers', formData);
      if (response.data.success) {
        showSuccess('Customer added successfully!');
        setShowForm(false);
        setFormData({ FullName: '', PhoneNumber: '' });
        fetchCustomers();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add customer';
      showError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Customer Management</h2>                    <p className="text-black mt-1">Register and manage hotel customers</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Customer
            </>
          )}
        </button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">Register New Customer</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="FullName"
                value={formData.FullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.FullName && errors.FullName ? 'border-red-500' : ''}`}
                placeholder="Enter full name"
                required
              />
              {touched.FullName && errors.FullName && (
                <p className="text-red-500 text-xs mt-1">{errors.FullName}</p>
              )}
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="PhoneNumber"
                value={formData.PhoneNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${touched.PhoneNumber && errors.PhoneNumber ? 'border-red-500' : ''}`}
                placeholder="e.g., +250 78X XXX XXX"
                required
              />
              {touched.PhoneNumber && errors.PhoneNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.PhoneNumber}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="form-label">Search Customers</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="input-field pl-10"
                placeholder="Search by name, phone number, or ID..."
              />
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">
            Customers ({filteredCustomers.length})
          </h3>
          {searchQuery && (              <span className="text-sm text-black">
              Filtered from {customers.length} total
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Full Name</th>
                <th className="px-6 py-3 text-left">Phone Number</th>
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
              ) : paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.CustomerID} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium text-black">#{customer.CustomerID}</td>
                    <td className="table-cell font-medium">{customer.FullName}</td>
                    <td className="table-cell">{customer.PhoneNumber}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-black">
                    {searchQuery ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p>No customers match your search. <button onClick={() => setSearchQuery('')} className="text-black underline">Clear search</button></p>
                      </div>
                    ) : (
                      'No customers found. Register your first customer!'
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
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Customers;
