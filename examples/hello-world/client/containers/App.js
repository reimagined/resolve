import React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image, Nav } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'

const App = () => {
  const resolveStatic = useStaticResolver()

  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: resolveStatic('/bootstrap.min.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: resolveStatic('/favicon.ico'),
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
            src={resolveStatic('/resolve-logo.png')}
            className="d-inline-block align-top"
          />{' '}
          Hello World Example
        </Navbar.Brand>

        <Nav className="ml-auto">
          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://facebook.com/resolvejs/">
              <Image src={resolveStatic('/fb-logo.png')} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://twitter.com/resolvejs">
              <Image src={resolveStatic('/twitter-logo.png')} />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://github.com/reimagined/resolve">
              <Image src={resolveStatic('/github-logo.png')} />
            </Nav.Link>
          </Navbar.Text>
        </Nav>
      </Navbar>
      <h1 className="text-center">Hello, reSolve world!</h1>
    </div>
  )
}

export default App
