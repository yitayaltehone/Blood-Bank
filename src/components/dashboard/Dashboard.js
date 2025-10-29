import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { inventoryAPI } from '../../services/api';

const Dashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const inventoryResponse = await inventoryAPI.getInventory();
      const inventoryData = inventoryResponse.data;
      setInventory(inventoryData);
      
      // Calculate stats from actual blood units data
      const availableUnits = inventoryData.filter(item => 
        item.status === 'available' || 
        (item.abo_test_result && item.abo_test_result !== 'pending' && 
         item.tti_test_result && item.tti_test_result === 'negative')
      );

      const totalUnits = availableUnits.length;
      const totalMl = availableUnits.reduce((sum, item) => sum + (item.volume || 450), 0); // Default to 450ml if volume not specified
      
      // Count blood types
      const bloodTypeCount = new Set(availableUnits.map(item => item.blood_type)).size;
      
      setStats({
        totalUnits,
        totalMl,
        bloodTypeCount,
        totalInventory: inventoryData.length
      });
      
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Please login again');
      } else {
        setError('Failed to fetch dashboard data');
      }
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'general_manager': 'General Manager',
      'data_manager': 'Data Manager',
      'abo_laboratory': 'ABO Laboratory',
      'infectious_laboratory': 'Infectious Laboratory',
      'council': 'Council',
      'blood_distributer': 'Blood Distributer'
    };
    return roleNames[role] || role;
  };

  const getStatusBadge = (unit) => {
    // If blood is tested in both ABO and TTI (negative), status should be available
    if (unit.abo_test_result && unit.abo_test_result !== 'pending' && 
        unit.tti_test_result && unit.tti_test_result === 'negative') {
      return <Badge bg="success">Available</Badge>;
    }
    
    // If testing in progress for either ABO or TTI
    if (unit.status === 'in_testing') {
      if (unit.abo_test_result === 'pending' && unit.tti_test_result !== 'pending') {
        return <Badge bg="warning">ABO Testing</Badge>;
      } else if (unit.tti_test_result === 'pending' && unit.abo_test_result !== 'pending') {
        return <Badge bg="warning">TTI Testing</Badge>;
      } else if (unit.abo_test_result === 'pending' && unit.tti_test_result === 'pending') {
        return <Badge bg="warning">ABO & TTI Testing</Badge>;
      }
    }
    
    // If tested in one but not the other
    if (unit.abo_test_result && unit.abo_test_result !== 'pending' && 
        (!unit.tti_test_result || unit.tti_test_result === 'pending')) {
      return <Badge bg="info">ABO Tested</Badge>;
    }
    
    if (unit.tti_test_result && unit.tti_test_result !== 'pending' && 
        (!unit.abo_test_result || unit.abo_test_result === 'pending')) {
      return <Badge bg="info">TTI Tested</Badge>;
    }
    
    // Default status display
    const statusConfig = {
      'available': { variant: 'success', text: 'Available' },
      'in_testing': { variant: 'warning', text: 'Testing' },
      'collected': { variant: 'secondary', text: 'Collected' },
      'approved': { variant: 'success', text: 'Approved' },
      'rejected': { variant: 'danger', text: 'Rejected' },
      'quarantined': { variant: 'dark', text: 'Quarantined' },
      'distributed': { variant: 'info', text: 'Distributed' }
    };
    
    const config = statusConfig[unit.status] || { variant: 'secondary', text: unit.status };
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

  const getTTIResultBadge = (result) => {
    const resultConfig = {
      'pending': { variant: 'warning', text: 'Pending' },
      'negative': { variant: 'success', text: 'Negative' },
      'positive': { variant: 'danger', text: 'Positive' }
    };
    const config = resultConfig[result] || { variant: 'secondary', text: result };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  // Group inventory by blood type and status for summary
  const getInventorySummary = () => {
    const summary = {};
    
    inventory.forEach(unit => {
      const key = unit.blood_type;
      if (!summary[key]) {
        summary[key] = {
          blood_type: key,
          total_units: 0,
          total_ml: 0,
          available_units: 0,
          available_ml: 0,
          testing_units: 0,
          status_breakdown: {}
        };
      }
      
      summary[key].total_units += 1;
      summary[key].total_ml += (unit.volume || 450);
      
      // Check if unit is available (both tests completed and TTI negative)
      if (unit.abo_test_result && unit.abo_test_result !== 'pending' && 
          unit.tti_test_result && unit.tti_test_result === 'negative') {
        summary[key].available_units += 1;
        summary[key].available_ml += (unit.volume || 450);
      }
      
      // Check if unit is in testing
      if (unit.status === 'in_testing' || 
          unit.abo_test_result === 'pending' || 
          unit.tti_test_result === 'pending') {
        summary[key].testing_units += 1;
      }
      
      // Track status breakdown
      const status = unit.status;
      summary[key].status_breakdown[status] = (summary[key].status_breakdown[status] || 0) + 1;
    });
    
    return Object.values(summary);
  };

  const inventorySummary = getInventorySummary();

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>Dashboard</h2>
          <Card>
            <Card.Body>
              <h5 className="card-title">Welcome, {user?.first_name} {user?.last_name}</h5>
              <p className="card-text">
                <strong>Role:</strong> {getRoleDisplayName(user?.role)} | 
                <strong> Department:</strong> {user?.department || 'N/A'}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <h5 className="card-title">Available Units</h5>
              <p className="card-text display-6">{stats.totalUnits || 0}</p>
              <small>Ready for distribution</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <h5 className="card-title">Total Blood (ml)</h5>
              <p className="card-text display-6">{stats.totalMl || 0}ml</p>
              <small>Available volume</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info">
            <Card.Body>
              <h5 className="card-title">Blood Types</h5>
              <p className="card-text display-6">{stats.bloodTypeCount || 0}</p>
              <small>Different types available</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <h5 className="card-title">Total Inventory</h5>
              <p className="card-text display-6">{stats.totalInventory || 0}</p>
              <small>All blood units</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <h5 className="card-title">Blood Inventory Summary</h5>
              {inventorySummary.length === 0 ? (
                <Alert variant="info">
                  No inventory data available yet.
                </Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Blood Type</th>
                      <th>Total Units</th>
                      <th>Total Volume</th>
                      <th>Available Units</th>
                      <th>Available Volume</th>
                      <th>Testing Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventorySummary.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg="dark">{item.blood_type}</Badge>
                        </td>
                        <td>{item.total_units}</td>
                        <td>{item.total_ml}ml</td>
                        <td>
                          <Badge bg={item.available_units > 0 ? 'success' : 'secondary'}>
                            {item.available_units}
                          </Badge>
                        </td>
                        <td>{item.available_ml}ml</td>
                        <td>
                          <Badge bg={item.testing_units > 0 ? 'warning' : 'secondary'}>
                            {item.testing_units}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5 className="card-title">Recent Blood Units</h5>
              {inventory.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No blood units found.
                </Alert>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {inventory.slice(0, 10).map((unit, index) => (
                    <Card key={unit.unit_id} className="mb-2">
                      <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>UNIT-{unit.unit_id}</strong>
                            <br />
                            <small>{unit.blood_type} • {unit.volume || 450}ml</small>
                          </div>
                          <div className="text-end">
                            {getStatusBadge(unit)}
                            <br />
                            <small>
                              ABO: {getABOResultBadge(unit.abo_test_result)}
                            </small>
                            <br />
                            <small>
                              TTI: {getTTIResultBadge(unit.tti_test_result)}
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;