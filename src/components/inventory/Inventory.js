import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Badge, Button, Modal, Form, Spinner, InputGroup, ListGroup } from 'react-bootstrap';
import { inventoryAPI, donorsAPI } from '../../services/api'; // Import both APIs
import { useAuth } from '../../context/AuthContext';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDonorList, setShowDonorList] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    blood_type: '',
    status: 'available',
    units: 1,
    total_ml: 450,
    donor_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching inventory data...');
      
      const response = await inventoryAPI.getInventory();
      console.log('Inventory API response:', response);
      
      if (response.data) {
        setInventory(response.data);
        console.log('Inventory data set:', response.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to fetch inventory data';
      
      if (error.response) {
        // Server responded with error status
        switch (error.response.status) {
          case 401:
            errorMessage += ': Unauthorized. Please log in again.';
            break;
          case 403:
            errorMessage += ': Access forbidden.';
            break;
          case 404:
            errorMessage += ': Inventory endpoint not found.';
            break;
          case 500:
            errorMessage += ': Server error. Please try again later.';
            break;
          default:
            errorMessage += `: Server error (${error.response.status}).`;
        }
        
        // Add server message if available
        if (error.response.data && error.response.data.message) {
          errorMessage += ` ${error.response.data.message}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += ': No response from server. Please check your network connection.';
      } else {
        // Something else happened
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
      setInventory([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      setDonorsLoading(true);
      setError('');
      const response = await donorsAPI.getDonors(); // Use donorsAPI instead of inventoryAPI
      
      // Handle different response structures
      const donorsData = response.data || response.data?.donors || response.data?.data || [];
      setDonors(donorsData);
      
      if (donorsData.length === 0) {
        console.warn('No donors found in response');
      }
    } catch (error) {
      console.error('Failed to fetch donors:', error);
      setError('Failed to load donor list. Please check if the donors API endpoint is available.');
      setDonors([]);
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleShowAddModal = async () => {
    // Fetch donors when modal opens
    await fetchDonors();
    
    // Calculate expiration date (42 days from collection)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 42);
    
    setFormData({
      blood_type: '',
      status: 'available',
      units: 1,
      total_ml: 450,
      donor_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      expiration_date: expirationDate.toISOString().split('T')[0],
      notes: ''
    });
    setSearchTerm('');
    setSelectedDonor(null);
    setShowDonorList(false);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      blood_type: '',
      status: 'available',
      units: 1,
      total_ml: 450,
      donor_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      notes: ''
    });
    setSearchTerm('');
    setSelectedDonor(null);
    setShowDonorList(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDonorList(true);
    
    // If search is cleared, reset selection
    if (!value) {
      setSelectedDonor(null);
      setFormData(prev => ({
        ...prev,
        donor_id: '',
        blood_type: ''
      }));
    }
  };

  const handleDonorSelect = (donor) => {
    const donorId = donor.id || donor.donor_id || donor._id;
    const bloodType = donor.blood_type || donor.bloodType || '';
    
    setSelectedDonor(donor);
    setSearchTerm(getDonorDisplayName(donor));
    setShowDonorList(false);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      donor_id: donorId,
      blood_type: bloodType
    }));

    console.log(`Selected donor: ${getDonorDisplayName(donor)}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate total_ml when units change
    if (name === 'units') {
      const units = parseInt(value) || 1;
      setFormData(prev => ({
        ...prev,
        units: units,
        total_ml: units * 450
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.blood_type) {
        throw new Error('Blood type is required');
      }
      if (!formData.donor_id) {
        throw new Error('Please select a donor');
      }

      // Log the data being sent for debugging
      console.log('Submitting inventory data:', formData);

      const response = await inventoryAPI.addInventoryItem(formData);
      console.log('API Response:', response);
      
      await fetchInventory(); // Refresh the inventory
      handleCloseAddModal();
    } catch (error) {
      console.error('API Error details:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to add new inventory entry: ';
      
      if (error.response) {
        // Server responded with error status
        switch (error.response.status) {
          case 405:
            errorMessage += 'Method not allowed. Please check if the API endpoint supports POST requests.';
            break;
          case 404:
            errorMessage += 'Endpoint not found. Please check the API URL.';
            break;
          case 500:
            errorMessage += 'Server error. Please try again later.';
            break;
          case 400:
            errorMessage += 'Bad request. Please check the data you entered.';
            break;
          case 401:
            errorMessage += 'Unauthorized. Please check your authentication.';
            break;
          case 403:
            errorMessage += 'Forbidden. You do not have permission to perform this action.';
            break;
          default:
            errorMessage += `Server error (${error.response.status}).`;
        }
        
        // Add server message if available
        if (error.response.data && error.response.data.message) {
          errorMessage += ` Server message: ${error.response.data.message}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your network connection.';
      } else {
        // Something else happened
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'available': { variant: 'success', text: 'Available' },
      'in_testing': { variant: 'warning', text: 'In Testing' },
      'approved': { variant: 'success', text: 'Approved' },
      'rejected': { variant: 'danger', text: 'Rejected' },
      'quarantined': { variant: 'secondary', text: 'Quarantined' },
      'expired': { variant: 'dark', text: 'Expired' },
      'distributed': { variant: 'info', text: 'Distributed' }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getBloodTypeCard = (bloodType) => {
    // Handle empty inventory state
    if (!inventory || inventory.length === 0) {
      return (
        <Col key={bloodType} md={3} className="mb-3">
          <Card className="text-white bg-secondary">
            <Card.Body className="text-center">
              <Card.Title>{bloodType}</Card.Title>
              <Card.Text className="display-6">0</Card.Text>
              <Card.Text>Units</Card.Text>
              <small>0 ml</small>
            </Card.Body>
          </Card>
        </Col>
      );
    }

    const bloodTypeData = inventory.filter(item => item.blood_type === bloodType);
    const totalUnits = bloodTypeData.reduce((sum, item) => sum + (item.units || 0), 0);
    const totalMl = bloodTypeData.reduce((sum, item) => sum + (item.total_ml || 0), 0);
    
    let alertClass = 'secondary';
    if (totalUnits === 0) {
      alertClass = 'danger';
    } else if (totalUnits < 5) {
      alertClass = 'warning';
    } else {
      alertClass = 'success';
    }

    return (
      <Col key={bloodType} md={3} className="mb-3">
        <Card className={`text-white bg-${alertClass}`}>
          <Card.Body className="text-center">
            <Card.Title>{bloodType}</Card.Title>
            <Card.Text className="display-6">{totalUnits}</Card.Text>
            <Card.Text>Units</Card.Text>
            <small>{totalMl} ml</small>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  // Get donor display name based on available fields
  const getDonorDisplayName = (donor) => {
    const donorId = donor.donor_id || donor.id || donor._id || 'N/A';
    const name = donor.name || `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || 'Unknown Donor';
    const bloodType = donor.blood_type || donor.bloodType || 'Unknown';
    
    return `${donorId} - ${name} (${bloodType})`;
  };

  // Filter active/eligible donors
  const activeDonors = donors.filter(donor => {
    const status = donor.status || donor.donor_status || donor.eligibility_status;
    return !status || status === 'active' || status === 'eligible' || status === 'approved';
  });

  // Filter donors based on search term
  const filteredDonors = activeDonors.filter(donor => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const donorId = (donor.donor_id || donor.id || donor._id || '').toString().toLowerCase();
    const name = (donor.name || `${donor.first_name || ''} ${donor.last_name || ''}`).toLowerCase();
    const bloodType = (donor.blood_type || donor.bloodType || '').toLowerCase();
    const email = (donor.email || '').toLowerCase();
    const phone = (donor.phone || donor.phone_number || '').toLowerCase();

    return (
      donorId.includes(searchLower) ||
      name.includes(searchLower) ||
      bloodType.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center mt-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading inventory data...
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>Blood Inventory Management</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Blood Type Summary Cards */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Blood Type Summary</Card.Title>
              <Row>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bloodType => 
                  getBloodTypeCard(bloodType)
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Inventory Table */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Detailed Inventory</Card.Title>
              {!inventory || inventory.length === 0 ? (
                <Alert variant="info">
                  No inventory data available. Start by adding blood units to the system.
                </Alert>
              ) : (
                <table className="table table-striped table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>Blood Type</th>
                      <th>Status</th>
                      <th>Units</th>
                      <th>Total Volume (ml)</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.blood_type}</strong>
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>{item.units || 0}</td>
                        <td>{item.total_ml || 0}</td>
                        <td>
                          {item.last_updated ? 
                            new Date(item.last_updated).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      {(user.role === 'general_manager' || user.role === 'data_manager') && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Body>
                <Card.Title>Quick Actions</Card.Title>
                <div className="d-grid gap-2 d-md-flex">
                  <button 
                    className="btn btn-primary me-md-2" 
                    onClick={handleShowAddModal}
                  >
                    Add Blood Unit
                  </button>
                  <button className="btn btn-success me-md-2" disabled>
                    Update Inventory
                  </button>
                  <button className="btn btn-info" disabled>
                    Generate Report
                  </button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Inventory Statistics */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Inventory Statistics</Card.Title>
              <ul className="list-unstyled">
                <li>Total Blood Types: {new Set(inventory.map(item => item.blood_type)).size}</li>
                <li>Total Units: {inventory.reduce((sum, item) => sum + (item.units || 0), 0)}</li>
                <li>Total Volume: {inventory.reduce((sum, item) => sum + (item.total_ml || 0), 0)} ml</li>
                <li>Available Units: {
                  inventory
                    .filter(item => item.status === 'available' || item.status === 'approved')
                    .reduce((sum, item) => sum + (item.units || 0), 0)
                }</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Status Distribution</Card.Title>
              <ul className="list-unstyled">
                {Object.entries(
                  inventory.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <li key={status}>
                    {getStatusBadge(status)}: {count} entries
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add New Entry Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Blood Unit</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Donor *</Form.Label>
                  <div className="position-relative">
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search and select donor by ID, name, blood type..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDonorList(true)}
                        disabled={donorsLoading}
                        required
                      />
                    </InputGroup>
                    
                    {/* Donor dropdown list */}
                    {showDonorList && searchTerm && (
                      <div 
                        className="position-absolute w-100 border bg-white shadow-sm"
                        style={{
                          zIndex: 1050,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          top: '100%',
                          left: 0
                        }}
                      >
                        <ListGroup variant="flush">
                          {donorsLoading ? (
                            <ListGroup.Item className="text-center">
                              <Spinner animation="border" size="sm" className="me-2" />
                              Loading donors...
                            </ListGroup.Item>
                          ) : filteredDonors.length === 0 ? (
                            <ListGroup.Item className="text-muted text-center">
                              No donors found matching "{searchTerm}"
                            </ListGroup.Item>
                          ) : (
                            filteredDonors.map(donor => (
                              <ListGroup.Item 
                                key={donor.id || donor.donor_id || donor._id}
                                action
                                onClick={() => handleDonorSelect(donor)}
                                className="py-2"
                                style={{ cursor: 'pointer' }}
                              >
                                <div>
                                  <strong>{getDonorDisplayName(donor)}</strong>
                                  {donor.email && (
                                    <div className="small text-muted">Email: {donor.email}</div>
                                  )}
                                  {donor.phone && (
                                    <div className="small text-muted">Phone: {donor.phone}</div>
                                  )}
                                </div>
                              </ListGroup.Item>
                            ))
                          )}
                        </ListGroup>
                      </div>
                    )}
                  </div>
                  <Form.Text className="text-muted">
                    {selectedDonor && `Selected: ${getDonorDisplayName(selectedDonor)}`}
                    {!selectedDonor && 'Type to search for donors - blood type will auto-fill when selected'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Blood Type *</Form.Label>
                  <Form.Select 
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.blood_type ? `Blood type: ${formData.blood_type}` : 'This will auto-fill when you select a donor'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="in_testing">In Testing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="quarantined">Quarantined</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Units *</Form.Label>
                  <Form.Control
                    type="number"
                    name="units"
                    value={formData.units}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    required
                  />
                  <Form.Text className="text-muted">
                    Number of blood units (1 unit = 450ml)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Volume (ml)</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_ml"
                    value={formData.total_ml}
                    onChange={handleInputChange}
                    required
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Collection Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="collection_date"
                    value={formData.collection_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiration Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or comments"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || !formData.donor_id || !formData.blood_type}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Adding...
                </>
              ) : (
                'Add Blood Unit'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Inventory;