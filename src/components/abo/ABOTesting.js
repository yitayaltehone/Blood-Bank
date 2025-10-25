import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Modal,
  Form, Alert, Badge, InputGroup, Tab, Tabs
} from 'react-bootstrap';
import { testingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ABOTesting = () => {
  const [awaitingTesting, setAwaitingTesting] = useState([]);
  const [inTesting, setInTesting] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [testNotes, setTestNotes] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchTestingData();
  }, []);

  const fetchTestingData = async () => {
    try {
      setLoading(true);
      const [awaitingResp, inProgressResp, completedResp] = await Promise.all([
        testingAPI.getUnitsAwaitingTesting(),
        testingAPI.getUnitsInTesting(),
        testingAPI.getTestedUnits()
      ]);
      
      setAwaitingTesting(awaitingResp.data);
      setInTesting(inProgressResp.data);
      setCompletedTests(completedResp.data);
    } catch (error) {
      setError('Failed to fetch testing data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (unit) => {
    setSelectedUnit(unit);
    setShowStartModal(true);
  };

  const handleConfirmStartTest = async () => {
    try {
      setLoading(true);
      await testingAPI.startTest(selectedUnit.unit_id);
      setSuccess('Test started successfully');
      setShowStartModal(false);
      fetchTestingData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordResult = (unit) => {
    setSelectedUnit(unit);
    setTestNotes('');
    setShowResultModal(true);
  };

  const handleSubmitResult = async (aboResult) => {
    try {
      setLoading(true);
      await testingAPI.recordResult(selectedUnit.unit_id, {
        abo_result: aboResult,
        notes: testNotes
      });
      setSuccess('Test result recorded successfully');
      setShowResultModal(false);
      fetchTestingData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record result');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'collected': { variant: 'secondary', text: 'Collected' },
      'available': { variant: 'info', text: 'Available' },
      'in_testing': { variant: 'warning', text: 'In Testing' },
      'approved': { variant: 'success', text: 'Approved' },
      'rejected': { variant: 'danger', text: 'Rejected' },
      'quarantined': { variant: 'dark', text: 'Quarantined' }
    };
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getABOResultBadge = (result) => {
    const resultConfig = {
      'pending': { variant: 'warning', text: 'Pending' },
      'A': { variant: 'danger', text: 'A' },
      'B': { variant: 'warning', text: 'B' },
      'AB': { variant: 'info', text: 'AB' },
      'O': { variant: 'success', text: 'O' },
      'inconclusive': { variant: 'dark', text: 'Inconclusive' }
    };
    const config = resultConfig[result] || { variant: 'secondary', text: result };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const filterUnits = (units) => {
    return units.filter(unit =>
      unit.blood_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.donor_number?.toString().includes(searchTerm) ||
      unit.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>ABO Blood Typing Laboratory</h2>
            <Button variant="outline-primary" onClick={fetchTestingData}>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Search */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search by blood type, donor ID, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <Card className="bg-light">
            <Card.Body className="py-2">
              <small>
                Awaiting Testing: <strong>{awaitingTesting.length}</strong> | 
                In Progress: <strong>{inTesting.length}</strong> |
                Completed: <strong>{completedTests.length}</strong>
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Tabs defaultActiveKey="awaiting" className="mb-4">
        <Tab eventKey="awaiting" title="Awaiting Testing">
          <Card>
            <Card.Body>
              <h5 className="card-title">Blood Units Ready for ABO Testing</h5>
              {loading ? (
                <Alert variant="info">Loading units...</Alert>
              ) : filterUnits(awaitingTesting).length === 0 ? (
                <Alert variant="info">
                  No units awaiting ABO testing. All units have been processed.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>Collection Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>ABO Result</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterUnits(awaitingTesting).map((unit) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="primary">UNIT-{unit.unit_id}</Badge>
                        </td>
                        <td>
                          <div>
                            <strong>{unit.first_name} {unit.last_name}</strong>
                            <br />
                            <small className="text-muted">ID: {unit.donor_number}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="danger">{unit.blood_type}</Badge>
                        </td>
                        <td>{new Date(unit.collection_date).toLocaleDateString()}</td>
                        <td>{new Date(unit.expiry_date).toLocaleDateString()}</td>
                        <td>{getStatusBadge(unit.status)}</td>
                        <td>{getABOResultBadge(unit.abo_test_result)}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartTest(unit)}
                          >
                            Start Test
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="in-progress" title="In Progress">
          <Card>
            <Card.Body>
              <h5 className="card-title">ABO Tests in Progress</h5>
              {filterUnits(inTesting).length === 0 ? (
                <Alert variant="info">No tests currently in progress.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>Collection Date</th>
                      <th>Test Started</th>
                      <th>Technician</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterUnits(inTesting).map((unit) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="warning">UNIT-{unit.unit_id}</Badge>
                        </td>
                        <td>
                          <div>
                            <strong>{unit.first_name} {unit.last_name}</strong>
                            <br />
                            <small className="text-muted">ID: {unit.donor_number}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="danger">{unit.blood_type}</Badge>
                        </td>
                        <td>{new Date(unit.collection_date).toLocaleDateString()}</td>
                        <td>
                          {unit.test_date ? new Date(unit.test_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>{unit.technician_name || 'N/A'}</td>
                        <td>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleRecordResult(unit)}
                          >
                            Record Result
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="completed" title="Completed Tests">
          <Card>
            <Card.Body>
              <h5 className="card-title">Completed ABO Tests</h5>
              {filterUnits(completedTests).length === 0 ? (
                <Alert variant="info">No completed tests found.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>ABO Result</th>
                      <th>Test Date</th>
                      <th>Technician</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterUnits(completedTests).map((unit) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="success">UNIT-{unit.unit_id}</Badge>
                        </td>
                        <td>
                          <div>
                            <strong>{unit.first_name} {unit.last_name}</strong>
                            <br />
                            <small className="text-muted">ID: {unit.donor_number}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="danger">{unit.blood_type}</Badge>
                        </td>
                        <td>
                          {getABOResultBadge(unit.abo_test_result)}
                          {unit.donor_blood_type && (
                            <div>
                              <small className={
                                unit.abo_test_result === unit.donor_blood_type.replace('+', '').replace('-', '') 
                                  ? 'text-success' 
                                  : 'text-danger'
                              }>
                                Donor: {unit.donor_blood_type}
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          {unit.test_date ? new Date(unit.test_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>{unit.technician_name || 'N/A'}</td>
                        <td>{getStatusBadge(unit.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Start Test Modal */}
      <Modal show={showStartModal} onHide={() => setShowStartModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Start ABO Test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUnit && (
            <div>
              <h6>Unit Details:</h6>
              <p><strong>Unit ID:</strong> UNIT-{selectedUnit.unit_id}</p>
              <p><strong>Donor:</strong> {selectedUnit.first_name} {selectedUnit.last_name}</p>
              <p><strong>Donor ID:</strong> {selectedUnit.donor_number}</p>
              <p><strong>Blood Type:</strong> {selectedUnit.blood_type}</p>
              <p><strong>Collection Date:</strong> {new Date(selectedUnit.collection_date).toLocaleDateString()}</p>
              
              <Alert variant="info" className="mt-3">
                <strong>Note:</strong> Starting the test will change the unit status to "In Testing" 
                and assign you as the testing technician.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStartModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmStartTest} disabled={loading}>
            {loading ? 'Starting...' : 'Start Test'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Record Result Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Record ABO Test Result</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUnit && (
            <div>
              <h6>Unit Details:</h6>
              <p><strong>Unit ID:</strong> UNIT-{selectedUnit.unit_id}</p>
              <p><strong>Donor:</strong> {selectedUnit.first_name} {selectedUnit.last_name}</p>
              <p><strong>Blood Type:</strong> {selectedUnit.blood_type}</p>
              
              <hr />
              
              <h6>ABO Test Result:</h6>
              <div className="mb-3">
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {['A', 'B', 'AB', 'O'].map(type => (
                    <Button
                      key={type}
                      variant="outline-primary"
                      size="lg"
                      className="mb-2"
                      style={{minWidth: '80px'}}
                      onClick={() => handleSubmitResult(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                
                <div className="mb-3">
                  <Button
                    variant="outline-warning"
                    onClick={() => handleSubmitResult('inconclusive')}
                  >
                    Inconclusive
                  </Button>
                </div>
              </div>
              
              <Form.Group>
                <Form.Label>Test Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  placeholder="Any observations or notes about the test..."
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ABOTesting;