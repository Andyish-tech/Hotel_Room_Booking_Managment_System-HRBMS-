import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { isRequired, isValidName, isValidUsername, isValidEmail, isValidPassword, validate, hasErrors } from '../utils/validation';
import Pagination from '../Components/Pagination';

const Users = ({ user: currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [formData, setFormData] = useState({
    FullName: '',
    Username: '',
    Email: '',
    Role: 'staff',
    Password: '',
  });

  const roles = ['admin', 'manager', 'staff'];

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clamp current page if it exceeds total (e.g., after deleting a record)
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const buildRules = () => ({
    FullName: [
      { validate: (v) => isRequired(v), message: 'Full name is required' },
      { validate: (v) => isValidName(v), message: 'Name cannot contain numbers or special characters' },
      { validate: (v) => !v || v.trim().length >= 2, message: 'Name must be at least 2 characters' },
    ],
    Username: [
      { validate: (v) => isRequired(v), message: 'Username is required' },
      { validate: (v) => isValidUsername(v), message: 'Username must be 3-30 characters (letters, numbers, underscore, hyphen)' },
    ],
    Email: [
      { validate: (v) => isRequired(v), message: 'Email address is required' },
      { validate: (v) => isValidEmail(v), message: 'Enter a valid email address with @ symbol (e.g., name@example.com)' },
    ],
    Password: [
      {
        validate: (v, data) => editingUser ? true : isRequired(v),
        message: 'Password is required for new users',
      },
      {
        validate: (v) => !v || isValidPassword(v),
        message: 'Password must be at least 6 characters',
      },
    ],
  });

  const resetForm = () => {
    setFormData({
      FullName: '',
      Username: '',
      Email: '',
      Role: 'staff',
      Password: '',
    });
    setEditingUser(null);
    setErrors({});
    setTouched({});
    setShowForm(false);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const rules = buildRules();
    const fieldRules = rules[name] || [];
    for (const rule of fieldRules) {
      if (!rule.validate(formData[name], formData)) {
        setErrors((prev) => ({ ...prev, [name]: rule.message }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [name]: null }));
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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      FullName: user.FullName,
      Username: user.Username,
      Email: user.Email || '',
      Role: user.Role,
      Password: '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rules = buildRules();
    const validationErrors = validate(rules, formData);
    setErrors(validationErrors);
    const allTouched = {};
    Object.keys(formData).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);

    if (hasErrors(validationErrors)) {
      showError('Please fix the form errors before submitting');
      return;
    }

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.Password) delete payload.Password;

        const response = await axios.put(`/users/${editingUser.UserID}`, payload);
        if (response.data.success) {
          showSuccess('User updated successfully!');
          resetForm();
          fetchUsers();
        }
      } else {
        const response = await axios.post('/users', formData);
        if (response.data.success) {
          showSuccess('User created successfully!');
          resetForm();
          fetchUsers();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      showError(message);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.UserID) {
      showError('You cannot delete your own account!');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await axios.delete(`/users/${id}`);
      if (response.data.success) {
        showSuccess('User deleted successfully!');
        fetchUsers();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user';
      showError(message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'badge-danger';
      case 'manager': return 'badge-warning';
      case 'staff': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">User Management</h2>
          <p className="text-black mt-1">Manage system user accounts{currentUser?.Role !== 'manager' ? ' (Admin only)' : ''}</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New User
            </>
          )}
        </button>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>                <input
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
              <label className="form-label">Username</label>                <input
                  type="text"
                  name="Username"
                  value={formData.Username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${touched.Username && errors.Username ? 'border-red-500' : ''}`}
                  placeholder="Enter username"
                  required
                />
              {touched.Username && errors.Username && (
                <p className="text-red-500 text-xs mt-1">{errors.Username}</p>
              )}
            </div>
            <div>
              <label className="form-label">Email</label>                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${touched.Email && errors.Email ? 'border-red-500' : ''}`}
                  placeholder="email@example.com"
                />
              {touched.Email && errors.Email && (
                <p className="text-red-500 text-xs mt-1">{errors.Email}</p>
              )}
            </div>
            <div>
              <label className="form-label">Role</label>
              {currentUser?.Role === 'manager' ? (
                <input
                  type="text"
                  value="staff"
                  className="input-field bg-gray-100"
                  disabled
                />
              ) : (
                <select
                  name="Role"
                  value={formData.Role}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  {roles.map(role => (
                    <option key={role} value={role} className="capitalize">{role}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">
                {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>                <input
                  type="password"
                  name="Password"
                  value={formData.Password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${touched.Password && errors.Password ? 'border-red-500' : ''}`}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                  required={!editingUser}
                  minLength={6}
                />
              {touched.Password && errors.Password && (
                <p className="text-red-500 text-xs mt-1">{errors.Password}</p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-success flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              {editingUser && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Full Name</th>
                <th className="px-6 py-3 text-left">Username</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.UserID} className="hover:bg-yellow-200 transition-colors">
                    <td className="table-cell font-medium text-black">#{user.UserID}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.FullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{user.FullName}</span>
                        {user.UserID === currentUser?.UserID && (
                          <span className="text-xs text-white bg-black px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">{user.Username}</td>
                    <td className="table-cell text-black">{user.Email || '—'}</td>
                    <td className="table-cell">
                      <span className={getRoleBadge(user.Role)}>
                        {user.Role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {currentUser?.Role !== 'manager' && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-black hover:bg-yellow-200 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {currentUser?.Role !== 'manager' && (
                          <button
                            onClick={() => handleDelete(user.UserID)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                            disabled={user.UserID === currentUser?.UserID}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-black">
                    No users found. Create your first user!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={users.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Users;
