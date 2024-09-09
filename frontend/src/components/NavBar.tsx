import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';


// Styled component for the Navbar
const StyledNavbar = styled(Navbar)`
  background-color: #F5F7F8; /* Optional: Set background color */
  
  .navbar-brand {
    color: #495E57 !important; /* Brand text color */
  }
`;

// Custom styled button for Nav.Link
const NavButton = styled(Nav.Link)`
  background-color: transparent; /* No background initially */
  color: #495E57 !important; /* Default text color */
  padding: 5px 10px;
  border: 2px solid #495E57; /* Initial border */
  border-radius: 5px;
  text-align: center;
  display: inline-block;
  transition: all 0.3s ease; /* Smooth transition for hover effects */
  margin-left: 10px; /* Add custom margin for separation */
  margin-right: 10px; /* Add custom margin for separation */
  margin-top: 5px;
  margin-bottom: 5px;

  &:hover {
    background-color: #F4CE14; /* Change background on hover */
    border-color: #F4CE14; /* Change border color on hover */
    color: #495E57 !important; /* Change text color on hover */
  }
`;

interface NavBarProps {
  brand: string;
  links: { name: string; href: string }[];
}

const NavBar: React.FC<NavBarProps> = ({ brand, links }) => {
  return (
    <StyledNavbar expand="lg">
      <Container>
        {/* Brand on the left */}
        <Navbar.Brand href="/">
        <FontAwesomeIcon icon={faBook}/> {brand} 
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Empty space on the left to push buttons to the right */}
          <Nav className="ms-auto"> {/* 'ms-auto' pushes buttons to the right */}
            {links.map((link, index) => (
              <NavButton key={index} href={link.href}>
                {link.name}
              </NavButton>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </StyledNavbar>
  );
};

export default NavBar;
