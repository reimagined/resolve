import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';

const App = ({ staticPath }): any => (
  <div>
    <Helmet>
      <title>reSolve Hello World TypeScript</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href={`${staticPath}/bootstrap.min.css`} />
      <link rel="icon" href={`${staticPath}/favicon.ico`} />
    </Helmet>

    <Navbar color="light" light expand="md">
      <NavbarBrand className="mr-auto" href="/">
        <img src={`${staticPath}/resolve-logo.png`} alt="resolve-logo" />
        Hello World TypeScript
      </NavbarBrand>

      <Nav navbar>
        <NavItem>
          <NavLink href="https://facebook.com/resolvejs/">
            <img src={`${staticPath}/fb-logo.png`} alt="fb-logo" />
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="https://twitter.com/resolvejs">
            <img src={`${staticPath}/twitter-logo.png`} alt="twitter-logo" />
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="https://github.com/reimagined/resolve">
            <img src={`${staticPath}/github-logo.png`} alt="github-logo" />
          </NavLink>
        </NavItem>
      </Nav>
    </Navbar>
    <h1 style={{ textAlign: 'center' }}>Hello, reSolve world!</h1>
  </div>
);

export default App;
