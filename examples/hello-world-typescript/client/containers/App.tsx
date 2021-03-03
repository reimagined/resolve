import React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image, Nav } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'

const App = () => {
  const staticResolver = useStaticResolver()

  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/bootstrap.min.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.ico'),
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
            src={staticResolver('/resolve-logo.png')}
            className="d-inline-block align-top"
          />{' '}
          Hello World Example
        </Navbar.Brand>

        <Nav className="ml-auto">
          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://facebook.com/resolvejs/">
              <Image src={staticResolver('/fb-logo.png')} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://twitter.com/resolvejs">
              <Image src={staticResolver('/twitter-logo.png')} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://github.com/reimagined/resolve">
              <Image src={staticResolver('/github-logo.png')} />
            </Nav.Link>
          </Navbar.Text>
        </Nav>
      </Navbar>
      <h1 className="text-center">Hello, reSolve world!</h1>
    </div>
  )
}

export default App
