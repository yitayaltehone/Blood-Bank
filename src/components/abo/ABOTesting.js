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
  const [selectedResult, setSelectedResult] = useState('');

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
    setSelectedResult('');
    setTestNotes('');
    setShowResultModal(true);
  };

  const handleSelectResult = (result) => {
    setSelectedResult(result);
  };

  const handleSubmitResult = async () => {
    if (!selectedResult) {
      setError('Please select a test result before submitting.');
      return;
    }

    try {
      setLoading(true);
      await testingAPI.recordResult(selectedUnit.unit_id, {
        abo_result: selectedResult,
        notes: testNotes
      });
      setSuccess('Test result recorded successfully');
      setShowResultModal(false);
      setSelectedResult('');
      setTestNotes('');
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
      'A+': { variant: 'danger', text: 'A+' },
      'A-': { variant: 'outline-danger', text: 'A-' },
      'B+': { variant: 'warning', text: 'B+' },
      'B-': { variant: 'outline-warning', text: 'B-' },
      'AB+': { variant: 'info', text: 'AB+' },
      'AB-': { variant: 'outline-info', text: 'AB-' },
      'O+': { variant: 'success', text: 'O+' },
      'O-': { variant: 'outline-success', text: 'O-' },
      'inconclusive': { variant: 'dark', text: 'Inconclusive' }
    };
    const config = resultConfig[result] || { variant: 'secondary', text: result };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getBloodTypeBadge = (bloodType) => {
    const bloodTypeConfig = {
      'A+': { variant: 'danger', text: 'A+' },
      'A-': { variant: 'outline-danger', text: 'A-' },
      'B+': { variant: 'warning', text: 'B+' },
      'B-': { variant: 'outline-warning', text: 'B-' },
      'AB+': { variant: 'info', text: 'AB+' },
      'AB-': { variant: 'outline-info', text: 'AB-' },
      'O+': { variant: 'success', text: 'O+' },
      'O-': { variant: 'outline-success', text: 'O-' }
    };
    const config = bloodTypeConfig[bloodType] || { variant: 'secondary', text: bloodType };
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

  // Count rows for each tab
  const awaitingCount = filterUnits(awaitingTesting).length;
  const inProgressCount = filterUnits(inTesting).length;
  const completedCount = filterUnits(completedTests).length;

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

      {/* Search and Stats */}
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
                <br />
                Showing: <strong>{awaitingCount + inProgressCount + completedCount}</strong> units
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Tabs defaultActiveKey="awaiting" className="mb-4">
        <Tab eventKey="awaiting" title={
          <span>
            Awaiting Testing 
            {awaitingCount > 0 && <Badge bg="primary" className="ms-2">{awaitingCount}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">
                Blood Units Ready for ABO Testing 
                <Badge bg="secondary" className="ms-2">{awaitingCount} units</Badge>
              </h5>
              {loading ? (
                <Alert variant="info">Loading units...</Alert>
              ) : awaitingCount === 0 ? (
                <Alert variant="info">
                  No units awaiting ABO testing. All units have been processed.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Collection Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>ABO Result</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterUnits(awaitingTesting).map((unit, index) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="light" text="dark">{index + 1}</Badge>
                        </td>
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

        <Tab eventKey="in-progress" title={
          <span>
            In Progress 
            {inProgressCount > 0 && <Badge bg="warning" className="ms-2">{inProgressCount}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">
                ABO Tests in Progress
                <Badge bg="secondary" className="ms-2">{inProgressCount} units</Badge>
              </h5>
              {inProgressCount === 0 ? (
                <Alert variant="info">No tests currently in progress.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
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
                    {filterUnits(inTesting).map((unit, index) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="light" text="dark">{index + 1}</Badge>
                        </td>
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
                          {getBloodTypeBadge(unit.blood_type)}
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

        <Tab eventKey="completed" title={
          <span>
            Completed Tests
            {completedCount > 0 && <Badge bg="success" className="ms-2">{completedCount}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">
                Completed ABO Tests
                <Badge bg="secondary" className="ms-2">{completedCount} units</Badge>
              </h5>
              {completedCount === 0 ? (
                <Alert variant="info">No completed tests found.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
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
                    {filterUnits(completedTests).map((unit, index) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg="light" text="dark">{index + 1}</Badge>
                        </td>
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
                          {getBloodTypeBadge(unit.blood_type)}
                        </td>
                        <td>
                          {getABOResultBadge(unit.abo_test_result)}
                          {unit.donor_blood_type && (
                            <div>
                              <small className={
                                unit.abo_test_result === unit.donor_blood_type 
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
              <p><strong>Blood Type:</strong> {getBloodTypeBadge(selectedUnit.blood_type)}</p>
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
              <p><strong>Blood Type:</strong> {getBloodTypeBadge(selectedUnit.blood_type)}</p>
              
              <hr />
              
              <h6>ABO Test Result:</h6>
              <Alert variant="info" className="mb-3">
                Select the blood type determined by your laboratory test:
              </Alert>
              
              <div className="mb-4">
                <Row className="g-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <Col key={type} xs={6} md={3}>
                      <Button
                        variant={selectedResult === type ? "primary" : "outline-primary"}
                        className="w-100 py-2 mb-2"
                        onClick={() => handleSelectResult(type)}
                      >
                        <div>
                          <strong>{type}</strong>
                          <br />
                          <small>Blood Type</small>
                        </div>
                      </Button>
                    </Col>
                  ))}
                </Row>
                
                <Row className="mt-2">
                  <Col xs={12}>
                    <Button
                      variant={selectedResult === 'inconclusive' ? "warning" : "outline-warning"}
                      className="w-100 py-2"
                      onClick={() => handleSelectResult('inconclusive')}
                    >
                      🚫 Inconclusive Result
                    </Button>
                  </Col>
                </Row>
              </div>

              {selectedResult && (
                <Alert variant={selectedResult === 'inconclusive' ? 'warning' : 'success'}>
                  <strong>Selected Result:</strong> {getABOResultBadge(selectedResult)}
                  {selectedResult !== 'inconclusive' && (
                    <div>
                      <small>This unit will be marked as <Badge bg="success">Approved</Badge></small>
                    </div>
                  )}
                  {selectedResult === 'inconclusive' && (
                    <div>
                      <small>This unit will be moved to <Badge bg="dark">Quarantined</Badge> for further testing</small>
                    </div>
                  )}
                </Alert>
              )}
              
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
          <Button 
            variant={selectedResult === 'inconclusive' ? 'warning' : 'primary'} 
            onClick={handleSubmitResult} 
            disabled={loading || !selectedResult}
          >
            {loading ? 'Recording...' : 'Record Result'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ABOTesting;