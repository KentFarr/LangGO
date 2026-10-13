import { Container, Nav, Navbar } from 'react-bootstrap';
import { FaBook } from 'react-icons/fa6';
import { Link, NavLink, useNavigate } from 'react-router';
import styled, { css } from 'styled-components';
import { useAuth } from '../auth/useAuth';
import { authClient } from '../lib/authClient';
import { colors } from '../theme';

const StyledNavbar = styled(Navbar)`
  background-color: ${colors.background};

  .navbar-brand {
    color: ${colors.primary};
    font-weight: 600;
  }
`;

const navButton = css`
  margin: 5px 0 5px 10px;
  padding: 5px 12px;
  border: 2px solid ${colors.primary};
  border-radius: 5px;
  background-color: transparent;
  color: ${colors.primary};
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover,
  &.active {
    border-color: ${colors.accent};
    background-color: ${colors.accent};
    color: ${colors.primary};
  }
`;

const NavButton = styled(NavLink)`
  ${navButton}
`;

const NavActionButton = styled.button`
  ${navButton}
`;

export default function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate('/');
  };

  return (
    <StyledNavbar expand="md">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FaBook aria-hidden className="me-2" />
          LangGo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto">
            {user ? (
              <>
                <NavButton to="/dashboard">Dashboard</NavButton>
                <NavActionButton type="button" onClick={handleSignOut}>
                  Log out
                </NavActionButton>
              </>
            ) : (
              <>
                <NavButton to="/signup">Sign up</NavButton>
                <NavButton to="/login">Log in</NavButton>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </StyledNavbar>
  );
}
