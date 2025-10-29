import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">
          🏥 Blood Bank System
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard">
                  Dashboard
                </Nav.Link>
                
                {(user.role === 'general_manager' || user.role === 'data_manager') && (
                  <>
                    <Nav.Link as={Link} to="/users">
                      Users
                    </Nav.Link>
                    <Nav.Link as={Link} to="/donors">
                      Donors
                    </Nav.Link>
                  </>
                )}
                  {user.role === 'council' && (
                  <Nav.Link as={Link} to="/donor-profile">
                    Donor Profile
                  </Nav.Link>
                )}
                {/* Add ABO Testing Link for authorized roles */}
                {(user.role === 'abo_laboratory' || user.role === 'general_manager' || user.role === 'data_manager') && (
                  <Nav.Link as={Link} to="/abo-testing">
                    ABO Testing
                  </Nav.Link>
                )}
                
                {(user.role === 'infectious_laboratory' || user.role === 'general_manager' || user.role === 'data_manager') && (
                  <Nav.Link as={Link} to="/infectious-testing">
                    Infectious Testing
                  </Nav.Link>
                )}
                
                {/* FIXED: Distribution Link - Remove the object syntax and use proper Nav.Link */}
                {(user.role === 'blood_distributer' || user.role === 'general_manager' || user.role === 'council') && (
                  <Nav.Link as={Link} to="/distribution">
                    Distribution
                  </Nav.Link>
                )}
                
                <Nav.Link as={Link} to="/inventory">
                  Inventory
                </Nav.Link>

                {/* Add Blood Requests Link for authorized roles */}
                {(user.role === 'general_manager' || user.role === 'council' || user.role === 'blood_distributer') && (
                  <Nav.Link as={Link} to="/requests">
                    Blood Requests
                  </Nav.Link>
                )}
              </Nav>
              
              <Nav>
                <NavDropdown title={`${user.first_name} ${user.last_name}`} id="user-dropdown">
                  <NavDropdown.ItemText>
                    <small>{getRoleDisplayName(user.role)}</small>
                  </NavDropdown.ItemText>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register">
                Register
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;