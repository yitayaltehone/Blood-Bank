// src/components/requests/BloodRequests.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Add, 
  Refresh, 
  Check, 
  Close,
  Visibility,
  LocalHospital
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI } from '../../services/api';

const BloodRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    hospital_name: '',
    hospital_department: '',
    requesting_doctor: '',
    blood_type: '',
    quantity_units: 1,
    urgency: 'medium',
    needed_by: '',
    medical_reason: '',
    notes: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const status = getStatusFromTab();
      const [requestsRes, statsRes] = await Promise.all([
        status ? requestsAPI.getRequests(`?status=${status}`) : requestsAPI.getRequests(),
        requestsAPI.getRequestStats()
      ]);
      
      setRequests(requestsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load blood requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromTab = () => {
    const statusMap = ['', 'pending', 'approved', 'rejected', 'fulfilled'];
    return statusMap[selectedTab] || '';
  };

  const handleCreateRequest = async () => {
    try {
      setLoading(true);
      
      const response = await requestsAPI.createRequest(formData);
      
      alert(response.data.message || 'Blood request created successfully!');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert(error.response?.data?.message || 'Error creating blood request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    
    try {
      await requestsAPI.approveRequest(requestId);
      alert('Request approved successfully!');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    try {
      await requestsAPI.rejectRequest(requestId);
      alert('Request rejected successfully!');
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.message || 'Error rejecting request');
    }
  };

  const handleFulfill = async (requestId) => {
    if (!window.confirm('Mark this request as fulfilled?')) return;
    
    try {
      await requestsAPI.fulfillRequest(requestId);
      alert('Request marked as fulfilled!');
      loadData();
    } catch (error) {
      console.error('Error fulfilling request:', error);
      alert(error.response?.data?.message || 'Error fulfilling request');
    }
  };

  const resetForm = () => {
    setFormData({
      hospital_name: '',
      hospital_department: '',
      requesting_doctor: '',
      blood_type: '',
      quantity_units: 1,
      urgency: 'medium',
      needed_by: '',
      medical_reason: '',
      notes: ''
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'error', label: 'Rejected' },
      fulfilled: { color: 'info', label: 'Fulfilled' },
      partially_fulfilled: { color: 'secondary', label: 'Partially Fulfilled' }
    };
    
    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getUrgencyChip = (urgency) => {
    const urgencyConfig = {
      low: { color: 'success', label: 'Low' },
      medium: { color: 'warning', label: 'Medium' },
      high: { color: 'error', label: 'High' },
      critical: { color: 'error', label: 'Critical' }
    };
    
    const config = urgencyConfig[urgency] || { color: 'default', label: urgency };
    return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const canCreateRequest = user && ['general_manager', 'council', 'blood_distributer'].includes(user.role);
  const canApproveReject = user && ['general_manager', 'council'].includes(user.role);
  const canFulfill = user && ['general_manager', 'blood_distributer'].includes(user.role);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Blood Requests
        </Typography>
        <Box>
          <Button startIcon={<Refresh />} onClick={loadData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          {canCreateRequest && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
            >
              New Request
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4">{stats.pending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4">{stats.approved || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4">{stats.rejected || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Fulfilled
              </Typography>
              <Typography variant="h4">{stats.fulfilled || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
          <Tab label="Fulfilled" />
        </Tabs>
      </Paper>

      {/* Requests Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Blood Type</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Needed By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography color="textSecondary">
                      No blood requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {req.request_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{req.hospital_name}</TableCell>
                    <TableCell>{req.hospital_department || '-'}</TableCell>
                    <TableCell>{req.requesting_doctor || '-'}</TableCell>
                    <TableCell>
                      <Chip label={req.blood_type} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {req.quantity_units} units
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {req.quantity_ml}ml
                      </Typography>
                    </TableCell>
                    <TableCell>{getUrgencyChip(req.urgency)}</TableCell>
                    <TableCell>{getStatusChip(req.status)} {getStatusChip(req.popup_code)}</TableCell>
                    <TableCell>{formatDate(req.request_date)}</TableCell>
                    <TableCell>{formatDate(req.needed_by)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {req.status === 'pending' && canApproveReject && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApprove(req.id)}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleReject(req.id)}
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {req.status === 'approved' && canFulfill && (
                          <Tooltip title="Mark as Fulfilled">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handleFulfill(req.id)}
                            >
                              <LocalHospital />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Request Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Blood Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Hospital Information */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hospital Name *"
                value={formData.hospital_name}
                onChange={(e) => setFormData(prev => ({ ...prev, hospital_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hospital Department"
                value={formData.hospital_department}
                onChange={(e) => setFormData(prev => ({ ...prev, hospital_department: e.target.value }))}
                placeholder="Optional"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Requesting Doctor"
                value={formData.requesting_doctor}
                onChange={(e) => setFormData(prev => ({ ...prev, requesting_doctor: e.target.value }))}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Blood Type *"
                value={formData.blood_type}
                onChange={(e) => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
                required
              >
                <MenuItem value="">Select Blood Type</MenuItem>
                {bloodTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Request Details */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity (Units) *"
                type="number"
                value={formData.quantity_units}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_units: e.target.value }))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Urgency *"
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                required
              >
                {urgencyLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Needed By"
                type="datetime-local"
                value={formData.needed_by}
                onChange={(e) => setFormData(prev => ({ ...prev, needed_by: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                placeholder="Optional"
              />
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Reason"
                multiline
                rows={3}
                value={formData.medical_reason}
                onChange={(e) => setFormData(prev => ({ ...prev, medical_reason: e.target.value }))}
                placeholder="Describe the medical reason for this blood request (optional)..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes or special requirements (optional)..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRequest}
            variant="contained"
            disabled={loading || !formData.hospital_name || !formData.blood_type || !formData.quantity_units}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BloodRequests;