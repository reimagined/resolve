import React from 'react'
import { Navbar, Image, Nav } from 'react-bootstrap'
import { Helmet } from 'react-helmet'

const App = ({ staticPath }) => {
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: `${staticPath}/bootstrap.min.css`,
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: `${staticPath}/favicon.ico`,
  }
  const links = [stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title="reSolve Hello World" link={links} meta={[meta]} />
      <Navbar>
        <Navbar.Brand href="#home">
          <Image
            src={`${staticPath}/resolve-logo.png`}
            className="d-inline-block align-top"
          />{' '}
          Hello World Example
        </Navbar.Brand>

        <Nav className="ml-auto">
          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://facebook.com/resolvejs/">
              <Image src={`${staticPath}/fb-logo.png`} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://twitter.com/resolvejs">
              <Image src={`${staticPath}/twitter-logo.png`} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://github.com/reimagined/resolve">
              <Image src={`${staticPath}/github-logo.png`} />
            </Nav.Link>
          </Navbar.Text>
        </Nav>
      </Navbar>
      <h1 align="center">Hello, reSolve world!</h1>
    </div>
  )
}

export default App
