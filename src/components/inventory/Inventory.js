import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Badge, Button, Modal, Form, Spinner, InputGroup, ListGroup, Table } from 'react-bootstrap';
import { inventoryAPI, donorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDonorList, setShowDonorList] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [useManualInput, setUseManualInput] = useState(false);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    status: 'collected',
    quantity_ml: 450,
    donor_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    storage_location: 'Main Storage',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await inventoryAPI.getInventory();
      
      if (response.data.success) {
        setInventory(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch inventory');
      }
      
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data. Please try again.');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      setDonorsLoading(true);
      console.log('🔄 Starting donor fetch...');
      
      // Test if donor API is available
      try {
        const testResponse = await fetch('http://localhost:5000/api/donors/test-simple');
        console.log('🔧 Test endpoint status:', testResponse.status);
        if (!testResponse.ok) {
          throw new Error(`Test endpoint failed: ${testResponse.status}`);
        }
        const testData = await testResponse.json();
        console.log('✅ Test endpoint response:', testData);
      } catch (testError) {
        console.error('❌ Donor API test failed:', testError);
        throw new Error('Donor API is not available. Check backend routes.');
      }

      // Try multiple endpoints
      let response;
      let donorsData = [];
      
      try {
        console.log('🔍 Trying /donors/all endpoint...');
        response = await donorsAPI.getAllDonors();
        console.log('📦 /donors/all response:', response);
        
        if (response.data) {
          if (response.data.success && Array.isArray(response.data.data)) {
            donorsData = response.data.data;
            console.log('✅ Using response.data.data');
          } else if (Array.isArray(response.data)) {
            donorsData = response.data;
            console.log('✅ Using direct response.data array');
          } else if (response.data.data && Array.isArray(response.data.data)) {
            donorsData = response.data.data;
            console.log('✅ Using response.data.data (no success flag)');
          }
        }
      } catch (allError) {
        console.log('❌ /donors/all failed, trying /donors...');
        try {
          response = await donorsAPI.getDonors();
          console.log('📦 /donors response:', response);
          
          if (response.data && response.data.data && Array.isArray(response.data.data.donors)) {
            donorsData = response.data.data.donors;
            console.log('✅ Using response.data.data.donors');
          }
        } catch (donorsError) {
          console.log('❌ /donors failed, trying debug endpoint...');
          try {
            response = await donorsAPI.debugDonors();
            console.log('📦 Debug response:', response);
            
            if (response.data && Array.isArray(response.data.all_donors)) {
              donorsData = response.data.all_donors;
              console.log('✅ Using response.data.all_donors');
            }
          } catch (debugError) {
            console.error('❌ All donor endpoints failed');
            throw new Error('All donor API endpoints failed. Check backend.');
          }
        }
      }

      console.log(`🎯 Final donors data:`, donorsData);
      console.log(`📈 Number of donors loaded: ${donorsData.length}`);
      
      if (donorsData.length > 0) {
        console.log('🔍 Sample donor:', donorsData[0]);
        console.log('🔍 Donor keys:', Object.keys(donorsData[0]));
      }
      
      setDonors(donorsData);
      
    } catch (error) {
      console.error('❌ Failed to fetch donors:', error);
      let errorMsg = 'Failed to load donor list. ';
      
      if (error.message.includes('Donor API is not available')) {
        errorMsg += 'Backend donor routes are not registered. ';
      } else if (error.response?.status === 404) {
        errorMsg += 'Donor API endpoint not found (404). ';
      } else if (error.response?.status === 500) {
        errorMsg += 'Server error. Check backend logs. ';
      }
      
      errorMsg += error.message;
      setError(errorMsg);
      setDonors([]);
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleShowAddModal = async () => {
    await fetchDonors();
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42);
    
    setFormData({
      status: 'collected',
      quantity_ml: 450,
      donor_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      storage_location: 'Main Storage',
      notes: ''
    });
    setSearchTerm('');
    setSelectedDonor(null);
    setShowDonorList(false);
    setUseManualInput(false);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      status: 'collected',
      quantity_ml: 450,
      donor_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      storage_location: 'Main Storage',
      notes: ''
    });
    setSearchTerm('');
    setSelectedDonor(null);
    setShowDonorList(false);
    setUseManualInput(false);
    setError('');
    setSuccess('');
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Fetch donors if we have a search term and no donors loaded yet
    if (value && value.length >= 2 && donors.length === 0) {
      await fetchDonors();
    }
    
    // Show dropdown if we have at least 2 characters
    setShowDonorList(value.length >= 2);
  };

  const handleDonorSelect = (donor) => {
    console.log('🎯 Selecting donor:', donor);
    
    const donorId = donor.id || donor.donor_id || donor._id;
    if (!donorId) {
      console.error('❌ No valid donor ID found:', donor);
      setError('Invalid donor selected');
      return;
    }
    
    setSelectedDonor(donor);
    setSearchTerm(getDonorDisplayName(donor));
    setShowDonorList(false);
    
    setFormData(prev => ({
      ...prev,
      donor_id: donorId.toString()
    }));

    console.log('✅ Donor selected, formData.donor_id:', donorId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.donor_id) {
        throw new Error('Please select a donor');
      }

      console.log('📤 Submitting blood unit:', formData);
      const response = await inventoryAPI.addBloodUnit(formData);
      
      if (response.data.success) {
        setSuccess('Blood unit added successfully!');
        await fetchInventory();
        setTimeout(() => {
          handleCloseAddModal();
        }, 1500);
      } else {
        throw new Error(response.data.error || 'Failed to add blood unit');
      }
    } catch (error) {
      console.error('API Error:', error);
      
      let errorMessage = 'Failed to add blood unit: ';
      
      if (error.response) {
        errorMessage += error.response.data?.error || error.response.data?.message || 'Server error';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'collected': { variant: 'primary', text: 'Collected' },
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

  const getABOBadge = (aboType) => {
    const aboConfig = {
      'A+': { variant: 'danger', text: 'A+' },
      'A-': { variant: 'danger', text: 'A-' },
      'B+': { variant: 'warning', text: 'B+' },
      'B-': { variant: 'warning', text: 'B-' },
      'AB+': { variant: 'info', text: 'AB+' },
      'AB-': { variant: 'info', text: 'AB-' },
      'O+': { variant: 'success', text: 'O+' },
      'O-': { variant: 'success', text: 'O-' },
      'pending': { variant: 'secondary', text: 'Pending' }
    };

    const config = aboConfig[aboType] || { variant: 'secondary', text: aboType || 'Unknown' };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getABOSummaryCard = (aboType) => {
    const aboData = Array.isArray(inventory) ? inventory.filter(item => item.abo_test_result === aboType) : [];
    const totalUnits = aboData.length;
    const totalMl = aboData.reduce((sum, item) => sum + (Number(item.quantity_ml) || 0), 0);
    const availableUnits = aboData.filter(item => 
      item.status === 'available' || item.status === 'approved'
    ).length;
    
    let alertClass = 'secondary';
    if (availableUnits === 0) {
      alertClass = 'danger';
    } else if (availableUnits < 3) {
      alertClass = 'warning';
    } else {
      alertClass = 'success';
    }

    return (
      <Col key={aboType} md={3} className="mb-3">
        <Card className={`text-white bg-${alertClass}`}>
          <Card.Body className="text-center">
            <Card.Title>{getABOBadge(aboType)}</Card.Title>
            <Card.Text className="display-6">{availableUnits}</Card.Text>
            <Card.Text>Available Units</Card.Text>
            <small>Total: {totalUnits} units, {totalMl} ml</small>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const getDonorDisplayName = (donor) => {
    if (!donor) return 'Unknown Donor';
    
    const donorId = donor.donor_id || donor.id || 'N/A';
    const firstName = donor.first_name || '';
    const lastName = donor.last_name || '';
    const name = `${firstName} ${lastName}`.trim() || 'Unknown Donor';
    
    return `${donorId} - ${name}`;
  };

  const getDonorFullName = (donor) => {
    if (!donor) return '';
    const firstName = donor.first_name || '';
    const lastName = donor.last_name || '';
    return `${firstName} ${lastName}`.trim();
  };

  const getDonorPhone = (donor) => {
    return donor.contact_number || donor.phone || 'No phone';
  };

  const filteredDonors = Array.isArray(donors) ? donors.filter(donor => {
    if (!searchTerm || searchTerm.length < 2) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in full name, phone number, and donor ID
    const fullName = getDonorFullName(donor).toLowerCase();
    const phone = getDonorPhone(donor).toLowerCase();
    const donorId = (donor.donor_id || donor.id || '').toString().toLowerCase();
    const email = (donor.email || '').toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      donorId.includes(searchLower) ||
      email.includes(searchLower)
    );
  }) : [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

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

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ABO Type Summary Cards */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Blood Inventory Summary by ABO Type</Card.Title>
              <Row>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'pending'].map(aboType => 
                  getABOSummaryCard(aboType)
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
              <Card.Title>Blood Inventory Details</Card.Title>
              {!inventory || inventory.length === 0 ? (
                <Alert variant="info">
                  No blood units in inventory. Start by adding blood units to the system.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Unit ID</th>
                        <th>Donor</th>
                        <th>ABO Type</th>
                        <th>Status</th>
                        <th>Quantity (ml)</th>
                        <th>Collection Date</th>
                        <th>Expiry Date</th>
                        <th>Storage Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg="dark">{item.unit_id || 'N/A'}</Badge>
                          </td>
                          <td>
                            {item.donor_first_name && item.donor_last_name ? 
                              `${item.donor_first_name} ${item.donor_last_name}` : 
                              'Unknown Donor'
                            }
                            {item.donor_number && (
                              <div><small className="text-muted">ID: {item.donor_number}</small></div>
                            )}
                          </td>
                          <td>{getABOBadge(item.abo_test_result)}</td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>{item.quantity_ml || 0} ml</td>
                          <td>{formatDate(item.collection_date)}</td>
                          <td>
                            <span className={
                              item.expiry_date && new Date(item.expiry_date) < new Date() ? 'text-danger fw-bold' : ''
                            }>
                              {formatDate(item.expiry_date)}
                            </span>
                          </td>
                          <td>{item.storage_location || 'Main Storage'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
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
                  <Button 
                    variant="primary" 
                    className="me-md-2" 
                    onClick={handleShowAddModal}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Blood Unit
                  </Button>
                  <Button variant="success" className="me-md-2" onClick={fetchInventory}>
                    <i className="fas fa-sync me-2"></i>
                    Refresh Inventory
                  </Button>
                  <Button variant="info" disabled>
                    <i className="fas fa-chart-bar me-2"></i>
                    Generate Report
                  </Button>
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
                <li>Total Units: {Array.isArray(inventory) ? inventory.length : 0}</li>
                <li>Total Volume: {Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + (Number(item.quantity_ml) || 0), 0) : 0} ml</li>
                <li>Available Units: {
                  Array.isArray(inventory) ? inventory.filter(item => 
                    item.status === 'available' || item.status === 'approved'
                  ).length : 0
                }</li>
                <li>Units in Testing: {
                  Array.isArray(inventory) ? inventory.filter(item => item.status === 'in_testing').length : 0
                }</li>
                <li>Expired Units: {
                  Array.isArray(inventory) ? inventory.filter(item => 
                    item.expiry_date && new Date(item.expiry_date) < new Date()
                  ).length : 0
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
                {Array.isArray(inventory) && Object.entries(
                  inventory.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <li key={status} className="mb-1">
                    {getStatusBadge(status)}: {count} units
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add New Blood Unit Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Blood Unit</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Donor *</Form.Label>
                  
                  {/* Manual input toggle for debugging */}
                  <div className="mb-2">
                    <Form.Check
                      type="switch"
                      id="manual-input-switch"
                      label="Enter donor ID manually (troubleshooting)"
                      checked={useManualInput}
                      onChange={(e) => setUseManualInput(e.target.checked)}
                    />
                  </div>

                  {useManualInput ? (
                    // Manual donor ID input
                    <Form.Control
                      type="text"
                      placeholder="Enter donor ID directly (e.g., 1, 2, 3...)"
                      value={formData.donor_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        donor_id: e.target.value
                      }))}
                      required
                    />
                  ) : (
                    // Donor search
                    <div className="position-relative">
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="fas fa-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by full name, phone number, or donor ID..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => {
                            if (searchTerm.length >= 2) {
                              setShowDonorList(true);
                            }
                          }}
                          disabled={donorsLoading}
                          required
                        />
                        <Button 
                          variant="outline-secondary" 
                          onClick={fetchDonors}
                          disabled={donorsLoading}
                          title="Refresh donor list"
                        >
                          {donorsLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="fas fa-sync"></i>
                          )}
                        </Button>
                      </InputGroup>
                      
                      {/* Selected donor info */}
                      {selectedDonor && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small>
                            <strong>Selected Donor:</strong> {getDonorDisplayName(selectedDonor)}
                            {selectedDonor.email && ` • Email: ${selectedDonor.email}`}
                            {selectedDonor.blood_type && ` • Blood Type: ${selectedDonor.blood_type}`}
                            <br />
                            <strong>Donor ID for form:</strong> {formData.donor_id}
                          </small>
                        </div>
                      )}
                      
                      {/* Donor dropdown list */}
                      {showDonorList && searchTerm.length >= 2 && (
                        <div 
                          className="position-absolute w-100 border bg-white shadow-sm mt-1"
                          style={{
                            zIndex: 1050,
                            maxHeight: '200px',
                            overflowY: 'auto'
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
                                <br />
                                <small>Total donors available: {donors.length}</small>
                              </ListGroup.Item>
                            ) : (
                              filteredDonors.slice(0, 10).map(donor => (
                                <ListGroup.Item 
                                  key={donor.id || donor.donor_id}
                                  action
                                  onClick={() => handleDonorSelect(donor)}
                                  className="py-2"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div>
                                    <strong>{getDonorDisplayName(donor)}</strong>
                                    <div className="small text-muted">
                                      {getDonorFullName(donor)} • Phone: {getDonorPhone(donor)}
                                      {donor.email && ` • Email: ${donor.email}`}
                                      {donor.blood_type && ` • Blood Type: ${donor.blood_type}`}
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              ))
                            )}
                          </ListGroup>
                        </div>
                      )}
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    {useManualInput 
                      ? 'Enter the donor ID directly' 
                      : `Type at least 2 characters to search. ${donors.length} donors loaded.`
                    }
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
                    <option value="collected">Collected</option>
                    <option value="in_testing">In Testing</option>
                    <option value="available">Available</option>
                    <option value="quarantined">Quarantined</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity (ml) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity_ml"
                    value={formData.quantity_ml}
                    onChange={handleInputChange}
                    min="350"
                    max="500"
                    step="50"
                    required
                  />
                  <Form.Text className="text-muted">
                    Standard blood unit: 450ml
                  </Form.Text>
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
                  <Form.Label>Expiry Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Blood units expire 42 days after collection
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Storage Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleInputChange}
                    placeholder="Main Storage"
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
                placeholder="Additional notes or comments about this blood unit..."
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
              disabled={submitting || !formData.donor_id}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Adding Blood Unit...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Add Blood Unit
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Inventory;