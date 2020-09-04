import React from 'react';
import { Image, Navbar } from 'react-bootstrap';

class Logo extends React.PureComponent {
  render() {
    return (
      <Navbar.Header>
        <Navbar.Brand>
          <Image className="example-icon" src="static/resolve-logo.png" />
          Shopping List
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
    );
  }
}

export default Logo;
