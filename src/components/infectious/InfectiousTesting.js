import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Modal,
  Form, Alert, Badge, InputGroup, Tab, Tabs
} from 'react-bootstrap';
import { infectiousAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InfectiousTesting = () => {
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
  const [requiredTests, setRequiredTests] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    fetchTestingData();
    fetchRequiredTests();
  }, []);

  const fetchTestingData = async () => {
    try {
      setLoading(true);
      const [awaitingResp, inProgressResp, completedResp] = await Promise.all([
        infectiousAPI.getUnitsAwaitingTesting(),
        infectiousAPI.getUnitsInTesting(),
        infectiousAPI.getTestedUnits()
      ]);
      
      setAwaitingTesting(awaitingResp.data);
      setInTesting(inProgressResp.data);
      setCompletedTests(completedResp.data);
    } catch (error) {
      setError('Failed to fetch infectious testing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequiredTests = async () => {
    try {
      const response = await infectiousAPI.getRequiredTests();
      setRequiredTests(response.data);
    } catch (error) {
      console.error('Failed to fetch required tests:', error);
    }
  };

  const handleStartTest = (unit) => {
    setSelectedUnit(unit);
    setShowStartModal(true);
  };

  const handleConfirmStartTest = async () => {
    try {
      setLoading(true);
      await infectiousAPI.startTest(selectedUnit.unit_id);
      setSuccess('Infectious test started successfully! The unit has been moved to "In Progress" tab.');
      setShowStartModal(false);
      fetchTestingData();
    } catch (error) {
      const errorDetails = error.response?.data?.details || '';
      setError(`${error.response?.data?.message || 'Failed to start infectious test'} ${errorDetails}`);
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
      await infectiousAPI.recordResult(selectedUnit.unit_id, {
        infectious_result: selectedResult,
        notes: testNotes
      });
      setSuccess(`Infectious test result recorded successfully! Unit marked as ${selectedResult === 'negative' ? 'Available' : 'Rejected'}.`);
      setShowResultModal(false);
      setSelectedResult('');
      setTestNotes('');
      fetchTestingData();
    } catch (error) {
      const errorDetails = error.response?.data?.details || '';
      setError(`${error.response?.data?.message || 'Failed to record infectious test result'} ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'collected': { variant: 'secondary', text: 'Collected' },
      'approved': { variant: 'success', text: 'ABO Approved' },
      'in_testing': { variant: 'warning', text: 'In Testing' },
      'available': { variant: 'info', text: 'Available' },
      'rejected': { variant: 'danger', text: 'Rejected' },
      'quarantined': { variant: 'dark', text: 'Quarantined' }
    };
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getInfectiousResultBadge = (result) => {
    const resultConfig = {
      'pending': { variant: 'warning', text: 'Pending' },
      'negative': { variant: 'success', text: 'Negative' },
      'positive': { variant: 'danger', text: 'Positive' }
    };
    const config = resultConfig[result] || { variant: 'secondary', text: result };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getABOResultBadge = (result) => {
    const resultConfig = {
      'A': { variant: 'danger', text: 'A' },
      'B': { variant: 'warning', text: 'B' },
      'AB': { variant: 'info', text: 'AB' },
      'O': { variant: 'success', text: 'O' },
      'pending': { variant: 'secondary', text: 'Not Tested' },
      'inconclusive': { variant: 'dark', text: 'Inconclusive' }
    };
    const config = resultConfig[result] || { variant: 'secondary', text: result || 'Not Tested' };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const hasCompletedABOTesting = (unit) => {
    return unit.abo_test_result && ['A', 'B', 'AB', 'O'].includes(unit.abo_test_result);
  };

  const getABOStatusAlert = (unit) => {
    if (hasCompletedABOTesting(unit)) {
      return <Badge bg="success" className="ms-1">✓ ABO Done</Badge>;
    } else {
      return <Badge bg="warning" className="ms-1">⚠️ ABO Pending</Badge>;
    }
  };

  const filterUnits = (units) => {
    return units.filter(unit =>
      unit.blood_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.donor_number?.toString().includes(searchTerm) ||
      unit.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Workflow explanation component
  const WorkflowGuide = () => (
    <Card className="mb-4 bg-light">
      <Card.Body>
        <h6>🦠 Infectious Disease Testing (TTIs) Workflow Guide</h6>
        <Row>
          <Col md={4}>
            <div className="text-center">
              <Badge bg="primary" className="mb-2">1</Badge>
              <h6>All Blood Units</h6>
              <small>Test any blood unit regardless of ABO testing status</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <Badge bg="warning" className="mb-2">2</Badge>
              <h6>Perform TTI Tests</h6>
              <small>Test for HIV, Hepatitis B/C, Syphilis, Malaria, HTLV</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <Badge bg="info" className="mb-2">3</Badge>
              <h6>Record Results</h6>
              <small>Negative = Available, Positive = Rejected</small>
            </div>
          </Col>
        </Row>
        <Alert variant="info" className="mt-3 mb-0">
          <strong>Note:</strong> You can perform infectious testing on <strong>any blood unit</strong>, regardless of whether ABO testing has been completed. 
          Units with completed ABO testing are marked with <Badge bg="success">✓ ABO Done</Badge>.
        </Alert>
      </Card.Body>
    </Card>
  );

  const RequiredTestsList = () => (
    <Card className="mb-4">
      <Card.Header>
        <h6 className="mb-0">🧪 Required Infectious Disease Tests</h6>
      </Card.Header>
      <Card.Body>
        <Row>
          {requiredTests.map((test) => (
            <Col key={test.id} md={4} className="mb-2">
              <div className="d-flex align-items-center">
                <Badge bg="danger" className="me-2">!</Badge>
                <div>
                  <strong>{test.name}</strong>
                  <br />
                  <small className="text-muted">{test.description}</small>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Infectious Disease Laboratory (TTIs)</h2>
              <p className="text-muted mb-0">Transfusion Transmissible Infections Testing - Works with any blood unit</p>
            </div>
            <Button variant="outline-primary" onClick={fetchTestingData}>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <WorkflowGuide />
      <RequiredTestsList />

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
        <Tab eventKey="awaiting" title={
          <span>
            All Units 
            {awaitingTesting.length > 0 && <Badge bg="primary" className="ms-2">{awaitingTesting.length}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">All Blood Units Ready for Infectious Testing</h5>
              <Alert variant="info" className="mb-3">
                <strong>Instructions:</strong> You can perform infectious testing on <strong>any blood unit</strong> regardless of ABO testing status. 
                Units with completed ABO testing are marked with <Badge bg="success">✓ ABO Done</Badge>.
              </Alert>
              
              {loading ? (
                <Alert variant="info">Loading units...</Alert>
              ) : filterUnits(awaitingTesting).length === 0 ? (
                <Alert variant="success">
                  🎉 All units have been processed! No units awaiting infectious testing.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>ABO Status</th>
                      <th>Collection Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Infectious Result</th>
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
                        <td>
                          {getABOResultBadge(unit.abo_test_result)}
                          {getABOStatusAlert(unit)}
                        </td>
                        <td>{new Date(unit.collection_date).toLocaleDateString()}</td>
                        <td>{new Date(unit.expiry_date).toLocaleDateString()}</td>
                        <td>{getStatusBadge(unit.status)}</td>
                        <td>{getInfectiousResultBadge(unit.infectious_test_result)}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartTest(unit)}
                          >
                            Start TTI Test
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
            {inTesting.length > 0 && <Badge bg="warning" className="ms-2">{inTesting.length}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">Infectious Tests in Progress</h5>
              <Alert variant="warning" className="mb-3">
                <strong>Instructions:</strong> After performing the infectious disease tests in the lab, 
                return here to record the results. Test for all required TTIs before recording final result.
              </Alert>
              
              {filterUnits(inTesting).length === 0 ? (
                <Alert variant="info">
                  No infectious tests currently in progress. Start a test from the "All Units" tab.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>ABO Status</th>
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
                        <td>
                          {getABOResultBadge(unit.abo_test_result)}
                          {getABOStatusAlert(unit)}
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
                            Record TTI Result
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
            Completed 
            {completedTests.length > 0 && <Badge bg="info" className="ms-2">{completedTests.length}</Badge>}
          </span>
        }>
          <Card>
            <Card.Body>
              <h5 className="card-title">Completed Infectious Tests</h5>
              <Alert variant="info" className="mb-3">
                <strong>View Only:</strong> This tab shows all completed infectious disease tests. 
                Negative results = Available for distribution, Positive results = Rejected units.
              </Alert>
              
              {filterUnits(completedTests).length === 0 ? (
                <Alert variant="info">No completed infectious tests found.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Unit ID</th>
                      <th>Donor</th>
                      <th>Blood Type</th>
                      <th>ABO Status</th>
                      <th>Infectious Result</th>
                      <th>Test Date</th>
                      <th>Technician</th>
                      <th>Final Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterUnits(completedTests).map((unit) => (
                      <tr key={unit.unit_id}>
                        <td>
                          <Badge bg={
                            unit.infectious_test_result === 'negative' ? 'info' : 'secondary'
                          }>
                            UNIT-{unit.unit_id}
                          </Badge>
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
                          {getABOStatusAlert(unit)}
                        </td>
                        <td>
                          {getInfectiousResultBadge(unit.infectious_test_result)}
                          {unit.infectious_test_result === 'positive' && (
                            <div>
                              <small className="text-danger">
                                ⚠️ Rejected - Positive TTI
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          {unit.infectious_test_date ? new Date(unit.infectious_test_date).toLocaleDateString() : 'N/A'}
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
          <Modal.Title>Start Infectious Disease Testing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUnit && (
            <div>
              <h6>Unit Details:</h6>
              <p><strong>Unit ID:</strong> UNIT-{selectedUnit.unit_id}</p>
              <p><strong>Donor:</strong> {selectedUnit.first_name} {selectedUnit.last_name}</p>
              <p><strong>Donor ID:</strong> {selectedUnit.donor_number}</p>
              <p><strong>Blood Type:</strong> {selectedUnit.blood_type}</p>
              <p><strong>ABO Status:</strong> {getABOResultBadge(selectedUnit.abo_test_result)} {getABOStatusAlert(selectedUnit)}</p>
              
              {hasCompletedABOTesting(selectedUnit) ? (
                <Alert variant="success" className="mt-3">
                  <strong>✓ ABO Testing Completed:</strong> This unit has successfully completed ABO blood typing.
                </Alert>
              ) : (
                <Alert variant="warning" className="mt-3">
                  <strong>⚠️ ABO Testing Pending:</strong> This unit has not completed ABO blood typing yet. 
                  You can still proceed with infectious testing.
                </Alert>
              )}
              
              <Alert variant="warning" className="mt-3">
                <strong>Required Tests:</strong>
                <ul className="mb-0 mt-2">
                  <li>HIV</li>
                  <li>Hepatitis B</li>
                  <li>Hepatitis C</li>
                  <li>Syphilis</li>
                  <li>Malaria</li>
                  <li>HTLV</li>
                </ul>
              </Alert>
              
              <Alert variant="info" className="mt-3">
                <strong>Next Steps:</strong> 
                <ul className="mb-0 mt-2">
                  <li>This unit will be moved to "In Progress"</li>
                  <li>You will be assigned as the testing technician</li>
                  <li>Perform all required TTI tests in the laboratory</li>
                  <li>Return to record the final combined result</li>
                </ul>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStartModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmStartTest} disabled={loading}>
            {loading ? 'Starting...' : 'Start TTI Testing'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Record Result Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Record Infectious Test Result</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUnit && (
            <div>
              <h6>Unit Details:</h6>
              <p><strong>Unit ID:</strong> UNIT-{selectedUnit.unit_id}</p>
              <p><strong>Donor:</strong> {selectedUnit.first_name} {selectedUnit.last_name}</p>
              <p><strong>Blood Type:</strong> {selectedUnit.blood_type}</p>
              <p><strong>ABO Status:</strong> {getABOResultBadge(selectedUnit.abo_test_result)} {getABOStatusAlert(selectedUnit)}</p>
              
              <hr />
              
              <h6>Infectious Disease Test Result:</h6>
              <Alert variant="info" className="mb-3">
                Select the final combined result after completing all required TTI tests:
              </Alert>
              
              <div className="mb-4">
                <Row className="g-2">
                  <Col xs={6}>
                    <Button
                      variant={selectedResult === 'negative' ? "success" : "outline-success"}
                      className="w-100 py-3"
                      onClick={() => handleSelectResult('negative')}
                    >
                      <div>
                        <strong style={{ fontSize: '1.5rem' }}>✅ Negative</strong>
                        <br />
                        <small>All tests negative - Safe for transfusion</small>
                      </div>
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button
                      variant={selectedResult === 'positive' ? "danger" : "outline-danger"}
                      className="w-100 py-3"
                      onClick={() => handleSelectResult('positive')}
                    >
                      <div>
                        <strong style={{ fontSize: '1.5rem' }}>❌ Positive</strong>
                        <br />
                        <small>One or more tests positive - Reject unit</small>
                      </div>
                    </Button>
                  </Col>
                </Row>
              </div>

              {selectedResult && (
                <Alert variant={selectedResult === 'negative' ? 'success' : 'danger'}>
                  <strong>Selected Result:</strong> {selectedResult.toUpperCase()}
                  {selectedResult === 'negative' && (
                    <div>
                      <small>This unit will be marked as <Badge bg="info">Available</Badge> for distribution</small>
                      {!hasCompletedABOTesting(selectedUnit) && (
                        <div>
                          <small className="text-warning">
                            ⚠️ Note: ABO testing is still pending for this unit
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedResult === 'positive' && (
                    <div>
                      <small>This unit will be marked as <Badge bg="danger">Rejected</Badge> and removed from inventory</small>
                    </div>
                  )}
                </Alert>
              )}
              
              <Form.Group>
                <Form.Label>
                  <strong>Test Notes (Optional)</strong>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  placeholder="Enter specific test results, observations, or any additional information..."
                />
                <Form.Text className="text-muted">
                  Example: "HIV: Negative, HBsAg: Negative, HCV: Negative, Syphilis: Negative, Malaria: Negative, HTLV: Negative"
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={selectedResult === 'negative' ? 'success' : 'danger'} 
            onClick={handleSubmitResult} 
            disabled={loading || !selectedResult}
          >
            {loading ? 'Recording...' : `Record as ${selectedResult?.toUpperCase()}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InfectiousTesting;