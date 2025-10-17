import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Modal, 
  Form, Alert, Badge, InputGroup 
} from 'react-bootstrap';
import { donorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DonorManagement = () => {
  const [donors, setDonors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    blood_type: 'A+',
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

  const fetchDonors = async () => {
    try {
      const response = await donorsAPI.getDonors();
      setDonors(response.data);
    } catch (error) {
      setError('Failed to fetch donors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await donorsAPI.createDonor(formData);
      setSuccess('Donor added successfully');
      setShowModal(false);
      resetForm();
      fetchDonors();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add donor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'Male',
      blood_type: 'A+',
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

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getEligibilityStatus = (lastDonationDate, totalDonations) => {
    if (!lastDonationDate) return { status: 'Eligible', variant: 'success' };
    
    const lastDonation = new Date(lastDonationDate);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
    
    // Assuming 56 days (8 weeks) between donations
    if (daysSinceLastDonation >= 56) {
      return { status: 'Eligible', variant: 'success' };
    } else {
      const daysRemaining = 56 - daysSinceLastDonation;
      return { status: `Eligible in ${daysRemaining} days`, variant: 'warning' };
    }
  };

  const getBloodTypeBadge = (bloodType) => {
    const bloodTypeColors = {
      'A+': 'danger',
      'A-': 'outline-danger',
      'B+': 'warning',
      'B-': 'outline-warning',
      'AB+': 'info',
      'AB-': 'outline-info',
      'O+': 'success',
      'O-': 'outline-success'
    };
    
    return <Badge bg={bloodTypeColors[bloodType] || 'secondary'}>{bloodType}</Badge>;
  };

  const filteredDonors = donors.filter(donor =>
    donor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.donor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.contact_number?.includes(searchTerm)
  );

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Donor Management</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add New Donor
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Search and Stats Row */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search donors by name, ID, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body className="py-2">
              <small>
                Total Donors: <strong>{donors.length}</strong> | 
                Showing: <strong>{filteredDonors.length}</strong>
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Donors Table */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title">Donor List</h5>
              {filteredDonors.length === 0 ? (
                <Alert variant="info">
                  {donors.length === 0 ? 'No donors found. Add your first donor!' : 'No donors match your search.'}
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Donor ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Blood Type</th>
                      <th>Contact</th>
                      <th>Total Donations</th>
                      <th>Last Donation</th>
                      <th>Eligibility</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((donor) => {
                      const age = calculateAge(donor.date_of_birth);
                      const eligibility = getEligibilityStatus(donor.last_donation_date, donor.total_donations);
                      
                      return (
                        <tr key={donor.id}>
                          <td>
                            <Badge bg="secondary">{donor.donor_id}</Badge>
                          </td>
                          <td>
                            <strong>{donor.first_name} {donor.last_name}</strong>
                          </td>
                          <td>{age}</td>
                          <td>{donor.gender}</td>
                          <td>{getBloodTypeBadge(donor.blood_type)}</td>
                          <td>
                            <div>{donor.contact_number}</div>
                            {donor.email && <small className="text-muted">{donor.email}</small>}
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{donor.total_donations || 0}</Badge>
                          </td>
                          <td>
                            {donor.last_donation_date ? 
                              new Date(donor.last_donation_date).toLocaleDateString() : 
                              'Never'
                            }
                          </td>
                          <td>
                            <Badge bg={eligibility.variant}>{eligibility.status}</Badge>
                          </td>
                          <td>
                            <Badge bg={donor.is_eligible ? 'success' : 'danger'}>
                              {donor.is_eligible ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Donor Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Donor</Modal.Title>
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
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Blood Type *</Form.Label>
                  <Form.Select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
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
                    rows={2}
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                    placeholder="Any known medical conditions..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Allergies</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    placeholder="Any known allergies..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding Donor...' : 'Add Donor'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DonorManagement;