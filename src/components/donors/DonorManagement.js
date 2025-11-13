import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Modal, 
  Form, Alert, Badge, InputGroup, Spinner, Pagination
} from 'react-bootstrap';
import { donorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DonorManagement = () => {
  const [donors, setDonors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 100,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    contact_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: '',
    allergies: ''
  });

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      
      const response = await donorsAPI.getDonors(page, 100, search);
      
      if (response.data.success) {
        // Handle the nested response structure
        const donorsData = response.data.data.donors || [];
        const paginationData = response.data.data.pagination || {};
        
        setDonors(donorsData);
        setPagination(paginationData);
        
        console.log('Fetched donors:', donorsData.length);
        if (donorsData.length > 0) {
          console.log('Sample donor:', donorsData[0]);
        }
      } else {
        throw new Error(response.data.error || 'Failed to fetch donors');
      }
      
    } catch (error) {
      console.error('Error fetching donors:', error);
      setError(error.response?.data?.error || error.message || 'Failed to fetch donors. Please try again.');
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchDonors(1, searchTerm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await donorsAPI.createDonor(formData);
      
      if (response.data.success) {
        setSuccess('Donor added successfully!');
        setShowModal(false);
        resetForm();
        fetchDonors(); // Refresh the list
      } else {
        throw new Error(response.data.error || 'Failed to create donor');
      }
    } catch (error) {
      console.error('Error creating donor:', error);
      setError(error.response?.data?.error || error.message || 'Failed to add donor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'Male',
      contact_number: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_conditions: '',
      allergies: ''
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
    setError('');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const getEligibilityStatus = (lastDonationDate) => {
    if (!lastDonationDate) return { status: 'Eligible', variant: 'success' };
    
    try {
      const lastDonation = new Date(lastDonationDate);
      const today = new Date();
      const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
      
      // 56 days (8 weeks) between donations
      if (daysSinceLastDonation >= 56) {
        return { status: 'Eligible', variant: 'success' };
      } else {
        const daysRemaining = 56 - daysSinceLastDonation;
        return { status: `Eligible in ${daysRemaining} days`, variant: 'warning' };
      }
    } catch (error) {
      return { status: 'Unknown', variant: 'secondary' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getSafeValue = (obj, key, defaultValue = 'N/A') => {
    return obj && obj[key] !== null && obj[key] !== undefined ? obj[key] : defaultValue;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchDonors(newPage, searchTerm);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchDonors(1, '');
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Donor Management</h2>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              disabled={loading}
            >
              <i className="fas fa-plus me-2"></i>
              Add New Donor
            </Button>
          </div>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Search and Stats */}
      <Row className="mb-4">
        <Col md={8}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search donors by name, ID, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
              <Button 
                variant="outline-primary" 
                type="submit"
                disabled={loading}
              >
                <i className="fas fa-search"></i>
              </Button>
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={clearSearch}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </InputGroup>
          </Form>
        </Col>
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Total: </small>
                  <strong>{pagination.total_count}</strong>
                </div>
                <div>
                  <small className="text-muted">Showing: </small>
                  <strong>{donors.length}</strong>
                </div>
                <div>
                  <small className="text-muted">Page: </small>
                  <strong>{pagination.page}</strong>
                  <small className="text-muted">/{pagination.total_pages}</small>
                </div>
                {loading && (
                  <Spinner animation="border" size="sm" variant="primary" />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Donors Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Donor List
                </h5>
                {loading && (
                  <Badge bg="primary">
                    <Spinner animation="border" size="sm" className="me-1" />
                    Loading...
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading && donors.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="lg" />
                  <p className="mt-3 text-muted">Loading donors...</p>
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">
                    {searchTerm ? 'No donors match your search' : 'No donors found'}
                  </h5>
                  <p className="text-muted">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Get started by adding your first donor'
                    }
                  </p>
                  {!searchTerm && (
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                      Add First Donor
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped bordered hover className="mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Donor ID</th>
                          <th>Name</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Contact</th>
                          <th className="text-center">Donations</th>
                          <th>Last Donation</th>
                          <th>Eligibility</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donors.map((donor) => {
                          const age = calculateAge(getSafeValue(donor, 'date_of_birth'));
                          const eligibility = getEligibilityStatus(getSafeValue(donor, 'last_donation_date'));
                          const totalDonations = getSafeValue(donor, 'total_donations', 0);
                          const isEligible = getSafeValue(donor, 'is_eligible', true);
                          
                          return (
                            <tr key={donor.id || donor.donor_id}>
                              <td>
                                <Badge bg="dark" className="font-monospace">
                                  {getSafeValue(donor, 'donor_id')}
                                </Badge>
                              </td>
                              <td>
                                <strong>
                                  {getSafeValue(donor, 'first_name', '')} {getSafeValue(donor, 'last_name', '')}
                                </strong>
                              </td>
                              <td>
                                <span className={age < 18 ? 'text-danger fw-bold' : ''}>
                                  {age}
                                </span>
                              </td>
                              <td>{getSafeValue(donor, 'gender')}</td>
                              <td>
                                <div className="fw-semibold">{getSafeValue(donor, 'contact_number')}</div>
                                {donor.email && (
                                  <small className="text-muted d-block">
                                    {getSafeValue(donor, 'email')}
                                  </small>
                                )}
                              </td>
                              <td className="text-center">
                                <Badge bg={totalDonations > 0 ? 'success' : 'secondary'}>
                                  {totalDonations}
                                </Badge>
                              </td>
                              <td>
                                <span className={!donor.last_donation_date ? 'text-muted' : ''}>
                                  {formatDate(getSafeValue(donor, 'last_donation_date'))}
                                </span>
                              </td>
                              <td>
                                <Badge bg={eligibility.variant}>
                                  {eligibility.status}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={isEligible ? 'success' : 'danger'}>
                                  {isEligible ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="d-flex justify-content-center p-3 border-top">
                      <Pagination>
                        <Pagination.Prev 
                          disabled={!pagination.has_prev || loading}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        />
                        
                        {[...Array(pagination.total_pages)].map((_, index) => {
                          const pageNum = index + 1;
                          // Show only relevant pages
                          if (
                            pageNum === 1 || 
                            pageNum === pagination.total_pages ||
                            (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                          ) {
                            return (
                              <Pagination.Item
                                key={pageNum}
                                active={pageNum === pagination.page}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={loading}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          } else if (
                            pageNum === pagination.page - 2 ||
                            pageNum === pagination.page + 2
                          ) {
                            return <Pagination.Ellipsis key={pageNum} />;
                          }
                          return null;
                        })}
                        
                        <Pagination.Next 
                          disabled={!pagination.has_next || loading}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Donor Modal */}
      <Modal show={showModal} onHide={handleModalClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Add New Donor
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    disabled={submitting}
                    placeholder="Enter first name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    disabled={submitting}
                    placeholder="Enter last name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    required
                    disabled={submitting}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Form.Text className="text-muted">
                    Donor must be at least 18 years old
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    disabled={submitting}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    required
                    disabled={submitting}
                    placeholder="+1234567890"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={submitting}
                    placeholder="donor@example.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                disabled={submitting}
                placeholder="Street address"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    disabled={submitting}
                    placeholder="City"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    disabled={submitting}
                    placeholder="State"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>ZIP Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                    disabled={submitting}
                    placeholder="ZIP Code"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Emergency Contact Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    disabled={submitting}
                    placeholder="Emergency contact name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Emergency Contact Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    disabled={submitting}
                    placeholder="Emergency contact phone"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Medical Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                    disabled={submitting}
                    placeholder="Any known medical conditions..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Allergies</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    disabled={submitting}
                    placeholder="Any known allergies..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleModalClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Adding Donor...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Add Donor
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DonorManagement;