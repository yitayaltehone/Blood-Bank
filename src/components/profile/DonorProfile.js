import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';

const DonorProfile = () => {
  const [donorProfile, setDonorProfile] = useState([]);
  const [filteredDonorProfile, setFilteredDonorProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDonorProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = donorProfile.filter(donor =>
        donor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.donor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.contact_number.includes(searchTerm)
      );
      setFilteredDonorProfile(filtered);
    } else {
      setFilteredDonorProfile(donorProfile);
    }
  }, [searchTerm, donorProfile]);

  const fetchDonorProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/donor_profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonorProfile(response.data);
      setFilteredDonorProfile(response.data);
    } catch (err) {
      setError('Failed to fetch donor profiles. You may not have permission to view this page.');
      console.error('Error fetching donor profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/donor_profile/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching donor profile stats:', err);
    }
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'A+': 'error',
      'A-': 'error',
      'B+': 'primary',
      'B-': 'primary',
      'AB+': 'secondary',
      'AB-': 'secondary',
      'O+': 'success',
      'O-': 'success'
    };
    return colors[bloodType] || 'default';
  };

  const getTTITestColor = (ttiTest) => {
    if (!ttiTest) return 'default';
    return ttiTest.toLowerCase().includes('negative') ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Donor Profiles
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View and manage donor information (Council Access Only)
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Donors
                </Typography>
                <Typography variant="h4">
                  {stats.total_donors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Blood Types Tested
                </Typography>
                <Typography variant="h6">
                  {stats.blood_type_distribution.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search donors by name, ID, or contact number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Donor Profile Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Donor List ({filteredDonorProfile.length} donors)
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Donor ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Sex</strong></TableCell>
                  <TableCell><strong>Age</strong></TableCell>
                  <TableCell><strong>Contact Number</strong></TableCell>
                  <TableCell><strong>ABO Test Result</strong></TableCell>
                  <TableCell><strong>TTI Test</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDonorProfile.map((donor) => (
                  <TableRow key={donor.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {donor.donor_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {donor.first_name} {donor.last_name}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={donor.sex || 'Not specified'} 
                        size="small"
                        color={donor.sex === 'Male' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{donor.age || 'N/A'}</TableCell>
                    <TableCell>{donor.contact_number || 'N/A'}</TableCell>
                    <TableCell>
                      {donor.abo_test_result ? (
                        <Chip 
                          label={donor.abo_test_result}
                          color={getBloodTypeColor(donor.abo_test_result)}
                          size="small"
                        />
                      ) : (
                        'Not tested'
                      )}
                    </TableCell>
                    <TableCell>
                      {donor.infectious_test_result ? (
                        <Chip 
                          label={donor.infectious_test_result}
                          color={getTTITestColor(donor.infectious_test_result)}
                          size="small"
                        />
                      ) : (
                        'Not tested'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDonorProfile.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        {searchTerm ? 'No donors found matching your search.' : 'No donors available.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DonorProfile;