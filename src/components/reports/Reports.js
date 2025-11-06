import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Paper
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Download, Refresh, Error as ErrorIcon } from '@mui/icons-material';
import api, { reportsAPI } from '../../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Debug logging - use ref to avoid dependency cycles
  const logDebug = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
    console.log(debugMessage);
    setDebugInfo(prev => prev + debugMessage + '\n');
  }, []); // Remove dependencies

  // Test backend connectivity
  const testBackendConnection = useCallback(async () => {
    try {
      logDebug('Testing backend connection');
      const response = await reportsAPI.test();
      logDebug('Backend test successful', response.data);
      return true;
    } catch (err) {
      logDebug('Backend test failed', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      return false;
    }
  }, [logDebug]); // Only depend on logDebug

  // Fetch available years
  const fetchAvailableYears = useCallback(async () => {
    try {
      logDebug('Fetching available years');
      const response = await reportsAPI.getYears();
      logDebug('Years fetched successfully', response.data);
      setAvailableYears(response.data);
      
      // Auto-select the most recent year if current year not in list
      if (response.data.length > 0 && !response.data.includes(year)) {
        setYear(response.data[0]);
        logDebug(`Auto-selected year: ${response.data[0]}`);
      }
    } catch (err) {
      logDebug('Error fetching years', {
        message: err.message,
        status: err.response?.status
      });
      setAvailableYears([new Date().getFullYear()]);
    }
  }, [logDebug, year]); // Dependencies are stable

  // Main reports fetch function - FIXED: Remove dependencies that cause re-renders
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      logDebug('Starting reports fetch', { period, year });

      // Test connection first
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to backend server');
      }

      logDebug('Fetching reports from API');
      const response = await reportsAPI.getSummary({ period, year });
      logDebug('API response received', {
        hasData: !!response.data,
        reportsCount: response.data?.reports?.length,
        period: response.data?.period,
        year: response.data?.year
      });

      if (response.data && response.data.reports && response.data.reports.length > 0) {
        setReports(response.data.reports);
        logDebug(`Successfully loaded ${response.data.reports.length} reports`);
      } else {
        setReports([]);
        logDebug('No report data received from API');
        setError('No data available for the selected period');
      }

    } catch (err) {
      logDebug('Error in fetchReports', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });

      let errorMessage = 'Failed to load reports: ';
      
      if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 401:
            errorMessage += 'Authentication failed. Please log in again.';
            break;
          case 403:
            errorMessage += 'Access denied. Your role does not have permission to view reports.';
            break;
          case 404:
            errorMessage += 'Reports endpoint not found. Please check backend configuration.';
            break;
          case 500:
            errorMessage += 'Server error. Please check backend logs.';
            break;
          default:
            errorMessage += `Server error (${err.response.status}).`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage += 'Cannot connect to server. Make sure the backend is running on http://localhost:5000';
      } else {
        // Something else happened
        errorMessage += err.message;
      }

      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [period, year, logDebug, testBackendConnection]); // Dependencies are stable

  // Initial load - only run once
  useEffect(() => {
    if (!initialized) {
      logDebug('Component mounted - initializing');
      const initialize = async () => {
        await fetchAvailableYears();
        await fetchReports();
        setInitialized(true);
      };
      initialize();
    }
  }, [initialized]); // Only depend on initialized

  // Fetch reports when period or year changes - only after initialization
  useEffect(() => {
    if (initialized) {
      logDebug('Period or year changed - fetching reports');
      fetchReports();
    }
  }, [period, year, initialized]); // Remove fetchReports and logDebug from dependencies

  // Fallback data for demonstration - FIXED: Remove logDebug dependency
  const getFallbackData = useCallback(() => {
    console.log('Generating fallback data');
    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    
    return months.map((month, index) => ({
      period: `${month} ${currentYear}`,
      start_date: `${currentYear}-${String(index + 1).padStart(2, '0')}-01`,
      end_date: `${currentYear}-${String(index + 1).padStart(2, '0')}-28`,
      collections: { 
        total: Math.floor(Math.random() * 30) + 20,
        total_volume_ml: Math.floor(Math.random() * 15000) + 10000,
        unique_donors: Math.floor(Math.random() * 25) + 15,
        avg_volume_per_unit: 450
      },
      distributions: { 
        total: Math.floor(Math.random() * 25) + 15,
        unique_requests: Math.floor(Math.random() * 20) + 10,
        unique_hospitals: Math.floor(Math.random() * 8) + 3
      },
      requests: { 
        total: Math.floor(Math.random() * 35) + 20,
        total_units: Math.floor(Math.random() * 40) + 25,
        total_ml: Math.floor(Math.random() * 18000) + 12000,
        avg_units_per_request: 1.2,
        unique_hospitals: Math.floor(Math.random() * 10) + 5
      },
      blood_type_distribution: [
        { blood_type: 'A+', count: 12, percentage: 25 },
        { blood_type: 'B+', count: 8, percentage: 16.7 },
        { blood_type: 'O+', count: 18, percentage: 37.5 },
        { blood_type: 'AB+', count: 6, percentage: 12.5 },
        { blood_type: 'A-', count: 2, percentage: 4.2 },
        { blood_type: 'B-', count: 1, percentage: 2.1 },
        { blood_type: 'O-', count: 1, percentage: 2.1 }
      ],
      inventory_status_distribution: [
        { status: 'available', count: 25, percentage: 52.1 },
        { status: 'distributed', count: 18, percentage: 37.5 },
        { status: 'in_testing', count: 3, percentage: 6.3 },
        { status: 'expired', count: 2, percentage: 4.2 }
      ],
      request_status_distribution: [
        { status: 'approved', count: 15, percentage: 42.9 },
        { status: 'fulfilled', count: 12, percentage: 34.3 },
        { status: 'pending', count: 6, percentage: 17.1 },
        { status: 'rejected', count: 2, percentage: 5.7 }
      ],
      efficiency_metrics: {
        fulfillment_rate: 85.7,
        collection_utilization: 75.0
      }
    }));
  }, []); // No dependencies

  const generatePDF = () => {
    // Simple PDF generation for demo
    alert('PDF generation would be implemented here');
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'A+': '#f44336', 'A-': '#e57373',
      'B+': '#2196f3', 'B-': '#64b5f6',
      'AB+': '#9c27b0', 'AB-': '#ba68c8',
      'O+': '#4caf50', 'O-': '#81c784'
    };
    return colors[bloodType] || '#757575';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9800',
      'approved': '#2196f3',
      'rejected': '#f44336',
      'fulfilled': '#4caf50',
      'available': '#4caf50',
      'distributed': '#2196f3',
      'expired': '#f44336',
      'in_testing': '#ff9800'
    };
    return colors[status] || '#757575';
  };

  // Render loading state
  if (loading && !initialized) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Reports...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fetching data from server
          </Typography>
        </Box>
      </Container>
    );
  }

  const displayReports = reports.length > 0 ? reports : getFallbackData();
  const isUsingFallbackData = reports.length === 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Blood Bank Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive reports and performance analytics
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={generatePDF}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Period</InputLabel>
                <Select
                  value={period}
                  label="Report Period"
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="monthly">Monthly Breakdown</MenuItem>
                  <MenuItem value="quarterly">Quarterly Summary</MenuItem>
                  <MenuItem value="semi_annual">Semi-Annual Overview</MenuItem>
                  <MenuItem value="yearly">Annual Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={year}
                  label="Year"
                  onChange={(e) => setYear(e.target.value)}
                  disabled={loading}
                >
                  {availableYears.map((yr) => (
                    <MenuItem key={yr} value={yr}>
                      {yr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                {isUsingFallbackData && (
                  <Chip 
                    icon={<ErrorIcon />} 
                    label="Demo Data" 
                    color="warning" 
                    size="small" 
                  />
                )}
                <Typography variant="body2" color="text.secondary">
                  {displayReports.length} periods loaded
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchReports} disabled={loading}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Debug Info - Collapsible */}
      {debugInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                {debugInfo}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview Dashboard" />
            <Tab label="Collections Analytics" />
            <Tab label="Distribution Analytics" />
            <Tab label="Request Analytics" />
          </Tabs>

          {/* Overview Dashboard */}
          {activeTab === 0 && (
            <Box sx={{ mt: 3 }}>
              {/* Key Metrics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white', height: 120 }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">
                        {displayReports.reduce((sum, report) => sum + report.collections.total, 0)}
                      </Typography>
                      <Typography variant="h6">Total Collections</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'success.main', color: 'white', height: 120 }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">
                        {displayReports.reduce((sum, report) => sum + report.distributions.total, 0)}
                      </Typography>
                      <Typography variant="h6">Total Distributions</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'warning.main', color: 'white', height: 120 }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">
                        {displayReports.reduce((sum, report) => sum + report.requests.total, 0)}
                      </Typography>
                      <Typography variant="h6">Total Requests</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'info.main', color: 'white', height: 120 }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">
                        {displayReports.reduce((sum, report) => sum + report.collections.unique_donors, 0)}
                      </Typography>
                      <Typography variant="h6">Unique Donors</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Activity Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={displayReports}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="collections.total" 
                            stroke="#8884d8" 
                            name="Collections"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="distributions.total" 
                            stroke="#82ca9d" 
                            name="Distributions"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="requests.total" 
                            stroke="#ffc658" 
                            name="Requests"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Blood Type Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={displayReports[0]?.blood_type_distribution || []}
                            dataKey="count"
                            nameKey="blood_type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ blood_type, percentage }) => `${blood_type} (${percentage}%)`}
                          >
                            {displayReports[0]?.blood_type_distribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBloodTypeColor(entry.blood_type)} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Collections Analytics */}
          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Collection Statistics
                      </Typography>
                      <Box sx={{ p: 2 }}>
                        {displayReports.map((report, index) => (
                          <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {report.period}
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2">Collections: {report.collections.total}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">Unique Donors: {report.collections.unique_donors}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">Total Volume: {(report.collections.total_volume_ml / 1000).toFixed(1)}L</Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Inventory Status
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={displayReports[0]?.inventory_status_distribution || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

        </CardContent>
      </Card>
    </Container>
  );
};

export default Reports;