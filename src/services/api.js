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

export const donorsAPI = {
  getDonors: () => api.get('/donors'),
  createDonor: (donorData) => api.post('/donors', donorData),
  searchDonors: (query) => api.get(`/donors/search?q=${query}`),
};

export const inventoryAPI = {
  getInventory: () => api.get('/inventory'),
  getAvailableUnits: (bloodType) => 
    api.get(`/inventory/units${bloodType ? `?blood_type=${bloodType}` : ''}`),
  addInventoryItem: (data) => {
    return api.post('/inventory', data);
  },
  getDonors: () => {
    return api.get('/donors');
  }
  
  // getActiveDonors: () => {
  //   return api.get('/donors/active'); // if you have a specific endpoint
  // }
};


export default api;