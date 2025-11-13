import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses - REMOVE the auto-redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error - token may be invalid');
      // Don't auto-redirect, just reject the promise
      // Let components handle authentication errors
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  getRoles: () => api.get('/users/roles'),
};

// services/api.js
export const donorsAPI = {
  // Get donors with pagination
  getDonors: (page = 1, perPage = 100, search = '') => {
    const params = { page, per_page: perPage };
    if (search) params.search = search;
    return api.get('/donors', { params });
  },
  
  // Get all donors without pagination (simple version)
  getAllDonors: () => api.get('/donors/all'),
  
  createDonor: (donorData) => api.post('/donors', donorData),
  
  searchDonors: (query, page = 1, perPage = 20) => {
    const params = { q: query, page, per_page: perPage };
    return api.get('/donors/search', { params });
  },
  
  getDonorById: (id) => api.get(`/donors/${id}`),
  
  updateDonor: (id, donorData) => api.put(`/donors/${id}`, donorData),
  
  getDonorByDonorId: (donorIdString) => api.get(`/donors/${donorIdString}`),
  
  // Debug endpoint
  debugDonors: () => api.get('/donors/debug')
};
// services/api.js
export const inventoryAPI = {
  // Get all inventory items
  getInventory: () => api.get('/inventory'),
  
  // Get inventory summary by ABO type and status
  getInventorySummary: () => api.get('/inventory/summary'),
  
  // Add new blood unit
  addBloodUnit: (bloodData) => api.post('/inventory', bloodData),
  
  // Get available units
  getAvailableUnits: () => api.get('/inventory/available'),
  
  // Get expiring units
  getExpiringUnits: (days = 7) => api.get(`/inventory/expiring?days=${days}`),
  
  // Get specific unit
  getUnitById: (unitId) => api.get(`/inventory/${unitId}`),
  
  // Update test results
  updateTestResults: (unitId, testData) => api.put(`/inventory/${unitId}/test`, testData),
  
  // Update unit status
  updateUnitStatus: (unitId, status) => api.put(`/inventory/${unitId}/status`, { status }),
  
  // Get inventory statistics
  getInventoryStats: () => api.get('/inventory/stats')
};

export const testingAPI = {
  // Get units for testing
  getUnitsAwaitingTesting: () => api.get('/testing/units/awaiting'),
  getUnitsInTesting: () => api.get('/testing/units/in-progress'),
  getTestedUnits: () => api.get('/testing/units/completed'),
  
  // Test management
  startTest: (unitId) => api.post(`/testing/start-test/${unitId}`),
  recordResult: (unitId, resultData) => api.post(`/testing/record-result/${unitId}`, resultData),
  
  // Stats and details
  getTestingStats: () => api.get('/testing/stats'),
  getUnitDetails: (unitId) => api.get(`/testing/unit/${unitId}`)
};
// Infectious Testing API
export const infectiousAPI = {
  // Get units for testing
  getUnitsAwaitingTesting: () => api.get('/infectious/units/awaiting'),
  getUnitsInTesting: () => api.get('/infectious/units/in-progress'),
  getTestedUnits: () => api.get('/infectious/units/completed'),
  getRequiredTests: () => api.get('/infectious/tests/required'),
  
  // Test management
  startTest: (unitId) => api.post(`/infectious/start-test/${unitId}`),
  recordResult: (unitId, resultData) => api.post(`/infectious/record-result/${unitId}`, resultData),
};
export const requestsAPI = {
  getRequests: (params = '') => api.get(`/requests${params}`),
  getRequestById: (id) => api.get(`/requests/${id}`),
  createRequest: (data) => api.post('/requests', data),
  updateRequest: (id, data) => api.put(`/requests/${id}`, data),
  approveRequest: (id) => api.put(`/requests/${id}/approve`),
  rejectRequest: (id) => api.put(`/requests/${id}/reject`),
  getRequestStats: () => api.get('/requests/stats')
};
// src/services/api.js
export const distributionService = {
  // Get all distributions (replaces getDistributionHistory)
  getDistributions: () => api.get('/distribution'),
  
  // Create new distribution (replaces distributeBlood)
  createDistribution: (data) => api.post('/distribution', data),
  
  // Get specific distribution
  getDistributionById: (id) => api.get(`/distribution/${id}`),
  
  // Get approved requests for distribution
  getApprovedRequests: () => api.get('/distribution/requests/approved'),
  
  // Get distribution statistics
  getDistributionStats: () => api.get('/distribution/stats'),
};
// Add to your existing api.js file
export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getDetailed: (params) => api.get('/reports/detailed', { params }),
  getYears: () => api.get('/reports/years'),
  getAnalytics: () => api.get('/reports/analytics'),
  test: () => api.get('/reports/test'),
};

export default api;