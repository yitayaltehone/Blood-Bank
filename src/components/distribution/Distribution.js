// src/components/distribution/Distribution.js
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
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Add, Refresh, LocalHospital, Bloodtype } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { distributionService, inventoryAPI } from '../../services/api';

const Distribution = () => {
  const { user } = useAuth();
  const [distributions, setDistributions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_hospital: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading distribution data...');
      
      // Use the new endpoints from the Flask backend
      const [distributionsRes, approvedRequestsRes, inventoryRes] = await Promise.all([
        distributionService.getDistributions(), // Changed from getDistributionHistory()
        distributionService.getApprovedRequests(), // New endpoint for approved requests
        inventoryAPI.getAvailableUnits() // Get available inventory
      ]);
      
      console.log('Distributions:', distributionsRes.data);
      console.log('Approved requests:', approvedRequestsRes.data);
      console.log('Available inventory:', inventoryRes.data);
      
      setDistributions(distributionsRes.data || []);
      setRequests(approvedRequestsRes.data || []);
      setInventory(inventoryRes.data || []);
      
      // Set debug info
      setDebugInfo(`
        Distributions: ${distributionsRes.data?.length || 0}
        Approved Requests: ${approvedRequestsRes.data?.length || 0}
        Available Inventory: ${inventoryRes.data?.length || 0}
        User Role: ${user?.role}
      `);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSelect = (requestId) => {
    const request = requests.find(req => req.id == requestId);
    setSelectedRequest(request);
    setSelectedUnits([]);
    
    // Auto-fill recipient info
    if (request) {
      setFormData({
        recipient_name: 'Hospital Patient',
        recipient_hospital: request.hospital_name,
        notes: `Distribution for request ${request.request_id}`
      });
    }
  };

  const handleUnitToggle = (unitId) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleDistribute = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedRequest || selectedUnits.length === 0) {
        setError('Please select a request and at least one blood unit');
        return;
      }

      const distributionData = {
        request_id: selectedRequest.id,
        blood_unit_ids: selectedUnits,
        ...formData
      };

      console.log('Sending distribution data:', distributionData);
      
      const result = await distributionService.createDistribution(distributionData);
      
      alert(`Blood distributed successfully! Distribution ID: ${result.data.distribution_id}`);
      setDialogOpen(false);
      resetForm();
      loadData(); // Reload to show new distribution
      
    } catch (error) {
      console.error('Error distributing blood:', error);
      const errorMsg = error.response?.data?.message || 'Error distributing blood';
      setError(errorMsg);
      alert(`Distribution failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRequest(null);
    setSelectedUnits([]);
    setFormData({
      recipient_name: '',
      recipient_hospital: '',
      notes: ''
    });
    setError('');
  };

  const getMatchingBloodUnits = () => {
    if (!selectedRequest) return [];
    return inventory.filter(unit => 
      unit.blood_type === selectedRequest.blood_type && 
      unit.status === 'available'
    );
  };

  const isDistributor = user && ['blood_distributer', 'general_manager'].includes(user?.role);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Blood Distribution
        </Typography>
        <Box>
          <Button 
            startIcon={<Refresh />} 
            onClick={loadData} 
            sx={{ mr: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
          {isDistributor && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              Distribute Blood
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontFamily="monospace" component="div">
            <pre>{debugInfo}</pre>
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Distributions
              </Typography>
              <Typography variant="h4">{distributions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Requests
              </Typography>
              <Typography variant="h4">{requests.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available Units
              </Typography>
              <Typography variant="h4">{inventory.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Distribution History Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Distribution ID</TableCell>
                <TableCell>Request ID</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Blood Type</TableCell>
                <TableCell>Unit ID</TableCell>
                <TableCell>Distributed By</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading distributions...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : distributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No distribution history found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                distributions.map((dist) => (
                  <TableRow key={dist.id}>
                    <TableCell>
                      <Chip label={dist.distribution_id} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      {dist.request_number || dist.request_id}
                    </TableCell>
                    <TableCell>{dist.recipient_hospital || dist.hospital_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={dist.blood_type} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {dist.unit_id || dist.blood_unit_id}
                    </TableCell>
                    <TableCell>
                      {dist.distributed_by_name} {dist.distributed_by_last_name}
                    </TableCell>
                    <TableCell>
                      {formatDate(dist.distribution_date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Distribute Blood Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LocalHospital sx={{ mr: 1 }} />
            Distribute Blood Units
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Step 1: Select Request */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                1. Select Approved Request ({requests.length} available)
              </Typography>
              <TextField
                select
                fullWidth
                label="Choose Approved Request"
                value={selectedRequest?.id || ''}
                onChange={(e) => handleRequestSelect(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">Select a request</MenuItem>
                {requests.map((req) => (
                  <MenuItem key={req.id} value={req.id}>
                    {req.request_id} - {req.hospital_name} ({req.blood_type}) - Need: {req.quantity_units} units
                    {req.urgency && ` - ${req.urgency} urgency`}
                  </MenuItem>
                ))}
              </TextField>
              {requests.length === 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No approved requests found. Requests must be approved by a manager first.
                </Alert>
              )}
            </Grid>

            {/* Step 2: Select Blood Units */}
            {selectedRequest && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  2. Select Blood Units ({selectedUnits.length} selected)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {getMatchingBloodUnits().length === 0 ? (
                    <Alert severity="warning">
                      No available blood units match the requested type: {selectedRequest.blood_type}
                      <br />
                      Available units: {inventory.filter(unit => unit.status === 'available').length}
                    </Alert>
                  ) : (
                    <List>
                      {getMatchingBloodUnits().map((unit) => (
                        <React.Fragment key={unit.unit_id}>
                          <ListItem>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedUnits.includes(unit.unit_id)}
                                  onChange={() => handleUnitToggle(unit.unit_id)}
                                  disabled={loading}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body1">
                                    Unit {unit.unit_id} - {unit.blood_type}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Collected: {formatDate(unit.collection_date)} | 
                                    Expires: {formatDate(unit.expiry_date)} |
                                    Volume: {unit.quantity_ml}ml
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Step 3: Distribution Details */}
            {selectedRequest && selectedUnits.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  3. Distribution Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Recipient Name"
                      value={formData.recipient_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="Enter recipient name"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hospital"
                      value={formData.recipient_hospital}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_hospital: e.target.value }))}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes about this distribution..."
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}
                {selectedRequest && selectedUnits.length > 0 && (
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                    4. Verification Code
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        Enter the 6-digit verification code that was generated when this request was approved.
                    </Typography>
                    </Alert>
                    <TextField
                    fullWidth
                    label="Verification Code"
                    value={formData.popup_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, popup_code: e.target.value }))}
                    placeholder="Enter 6-digit code"
                    disabled={loading}
                    inputProps={{ maxLength: 6 }}
                    />
                </Grid>
                )}
            {/* Summary */}
            {selectedUnits.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="subtitle1">
                    Ready to distribute {selectedUnits.length} blood unit(s) for request {selectedRequest?.request_id}
                  </Typography>
                  {selectedRequest && (
                    <Typography variant="body2">
                      Requested: {selectedRequest.quantity_units} units of {selectedRequest.blood_type}
                    </Typography>
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDistribute}
            variant="contained"
            disabled={loading || !selectedRequest || selectedUnits.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <Bloodtype />}
          >
            {loading ? 'Distributing...' : `Distribute ${selectedUnits.length} Unit(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Distribution;