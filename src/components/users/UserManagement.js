import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Card, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { usersAPI } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rawData, setRawData] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'data_manager',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    employee_id: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setFetchLoading(true);
      setError('');
      console.log('🔍 Fetching users from API...');
      
      const response = await usersAPI.getUsers();
      console.log('📦 Full API response:', response);
      console.log('📊 Response data:', response.data);
      console.log('📋 Response data type:', typeof response.data);
      console.log('🔢 Response data length:', response.data ? response.data.length : 0);
      
      // Store raw data for debugging
      setRawData(response.data);
      
      // Handle different response structures
      let usersData = [];
      
      if (Array.isArray(response.data)) {
        usersData = response.data;
        console.log('✅ Data is direct array');
        
        // Debug: Show what's actually in the first user
        if (usersData.length > 0) {
          console.log('👤 First user object:', usersData[0]);
          console.log('🔑 First user keys:', Object.keys(usersData[0]));
        }
      } else if (response.data && Array.isArray(response.data.users)) {
        usersData = response.data.users;
        console.log('✅ Data is nested in users property');
      } else if (response.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
        console.log('✅ Data is nested in data property');
      } else {
        console.warn('⚠️ Unexpected data structure:', response.data);
        usersData = [];
      }
      
      console.log('👥 Final users data to set:', usersData);
      setUsers(usersData);
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setError('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.createUser(formData);
      setSuccess('User created successfully');
      setShowModal(false);
      setFormData({
        username: '', email: '', password: '', role: 'data_manager',
        first_name: '', last_name: '', phone: '', department: '', employee_id: ''
      });
      await fetchUsers();
    } catch (error) {
      setError('Failed to create user: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      'general_manager': 'bg-danger',
      'data_manager': 'bg-primary',
      'abo_laboratory': 'bg-warning text-dark',
      'infectious_laboratory': 'bg-info',
      'council': 'bg-secondary',
      'blood_distributer': 'bg-success'
    };
    return <span className={`badge ${roleClasses[role] || 'bg-secondary'}`}>{role}</span>;
  };

  // Function to safely get field values
  const getFieldValue = (user, field) => {
    if (!user) return 'N/A';
    
    // Try different possible field names
    const possibleFields = {
      'id': ['id', 'user_id', '_id'],
      'username': ['username', 'user_name', 'userName'],
      'email': ['email', 'email_address'],
      'first_name': ['first_name', 'firstName', 'firstname', 'fname'],
      'last_name': ['last_name', 'lastName', 'lastname', 'lname'],
      'role': ['role', 'user_role', 'role_name'],
      'department': ['department', 'dept', 'department_name'],
      'phone': ['phone', 'phone_number', 'telephone', 'mobile'],
      'is_active': ['is_active', 'active', 'status', 'isActive']
    };

    const fields = possibleFields[field];
    if (fields) {
      for (const fieldName of fields) {
        if (user[fieldName] !== undefined && user[fieldName] !== null && user[fieldName] !== '') {
          return user[fieldName];
        }
      }
    }
    
    return 'N/A';
  };

  if (fetchLoading) {
    return (
      <Container fluid>
        <div className="text-center mt-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading users...
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>User Management</h2>
            <div>
              <Button 
                variant="outline-info" 
                onClick={() => {
                  console.log('📊 Current raw data:', rawData);
                  console.log('👥 Current users state:', users);
                }}
                className="me-2"
              >
                Debug Data
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={fetchUsers}
                className="me-2"
              >
                Refresh
              </Button>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add New User
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Debug Information */}
      {rawData && (
        <Row className="mb-3">
          <Col>
            <Card className="bg-light">
              <Card.Body>
                <h6>Debug Information</h6>
                <small>
                  <strong>Raw data type:</strong> {typeof rawData}<br />
                  <strong>Raw data length:</strong> {Array.isArray(rawData) ? rawData.length : 'N/A'}<br />
                  <strong>First item keys:</strong> {Array.isArray(rawData) && rawData[0] ? Object.keys(rawData[0]).join(', ') : 'N/A'}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">System Users ({users.length})</h5>
                <small className="text-muted">
                  {users.length} users found
                </small>
              </div>
              
              {users.length === 0 ? (
                <Alert variant="info">
                  No users found in the system.
                </Alert>
              ) : (
                <>
                  {/* Simple debug view */}
                  <div className="mb-3 p-3 bg-warning bg-opacity-10 border border-warning rounded">
                    <h6>Debug: First User Structure</h6>
                    <pre className="mb-0 small">
                      {JSON.stringify(users[0], null, 2)}
                    </pre>
                  </div>

                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Phone</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={index}>
                          <td>{getFieldValue(user, 'id')}</td>
                          <td>
                            {getFieldValue(user, 'first_name')} {getFieldValue(user, 'last_name')}
                          </td>
                          <td>{getFieldValue(user, 'username')}</td>
                          <td>{getFieldValue(user, 'email')}</td>
                          <td>
                            {getFieldValue(user, 'role') !== 'N/A' ? (
                              getRoleBadge(getFieldValue(user, 'role'))
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{getFieldValue(user, 'department')}</td>
                          <td>{getFieldValue(user, 'phone')}</td>
                          <td>
                            <span className={`badge ${
                              getFieldValue(user, 'is_active') === true || getFieldValue(user, 'is_active') === 'true' || getFieldValue(user, 'is_active') === 1 
                                ? 'bg-success' 
                                : 'bg-danger'
                            }`}>
                              {getFieldValue(user, 'is_active') === true || getFieldValue(user, 'is_active') === 'true' || getFieldValue(user, 'is_active') === 1 
                                ? 'Active' 
                                : 'Inactive'
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add User Modal - Keep the same as before */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
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
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="data_manager">Data Manager</option>
                    <option value="abo_laboratory">ABO Laboratory</option>
                    <option value="infectious_laboratory">Infectious Laboratory</option>
                    <option value="blood_distributer">Blood Distributer</option>
                    <option value="council">Council</option>
                    <option value="general_manager">General Manager</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Employee ID</Form.Label>
              <Form.Control
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;