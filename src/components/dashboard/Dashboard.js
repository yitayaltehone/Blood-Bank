import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert } from 'react-bootstrap';
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
      setInventory(inventoryResponse.data);
      
      // Calculate basic stats
      const totalUnits = inventoryResponse.data.reduce((sum, item) => sum + (item.units || 0), 0);
      const totalMl = inventoryResponse.data.reduce((sum, item) => sum + (item.total_ml || 0), 0);
      
      setStats({
        totalUnits,
        totalMl
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
              <h5 className="card-title">Total Blood Units</h5>
              <p className="card-text display-6">{stats.totalUnits || 0}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <h5 className="card-title">Total Blood (ml)</h5>
              <p className="card-text display-6">{stats.totalMl || 0}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info">
            <Card.Body>
              <h5 className="card-title">Available Types</h5>
              <p className="card-text display-6">{inventory.length || 0}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <h5 className="card-title">Your Role</h5>
              <p className="card-text">{getRoleDisplayName(user?.role)}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h5 className="card-title">Blood Inventory Summary</h5>
              {inventory.length === 0 ? (
                <Alert variant="info">
                  No inventory data available yet.
                </Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Blood Type</th>
                      <th>Status</th>
                      <th>Units</th>
                      <th>Total (ml)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, index) => (
                      <tr key={index}>
                        <td>{item.blood_type}</td>
                        <td>
                          <span className={`badge ${
                            item.status === 'available' ? 'bg-success' : 
                            item.status === 'in_testing' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.units || 0}</td>
                        <td>{item.total_ml || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;