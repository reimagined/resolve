import React from 'react'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { Navbar, Nav } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import { StaticImage } from './StaticImage'
const Header = ({ title, name, css, favicon }) => {
  const resolveStatic = useStaticResolver()
  const stylesheetLinks = css.map((href) => ({
    rel: 'stylesheet',
    href: resolveStatic(href),
  }))
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: resolveStatic(favicon),
  }
  const links = [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }
  return (
    <div>
      <Helmet title={title} link={links} meta={[meta]} />
      <Navbar>
        <Navbar.Brand href="#home">
          <StaticImage
            src="/resolve-logo.png"
            className="d-inline-block align-top"
          />
          {` ${name}`}
        </Navbar.Brand>

        <Nav className="ml-auto">
          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://facebook.com/resolvejs/">
              <StaticImage src="/fb-logo.png" />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://twitter.com/resolvejs">
              <StaticImage src="/twitter-logo.png" />
            </Nav.Link>
          </Navbar.Text>

          <Navbar.Text className="navbar-right">
            <Nav.Link href="https://github.com/reimagined/resolve">
              <StaticImage src="/github-logo.png" />
            </Nav.Link>
          </Navbar.Text>
        </Nav>
      </Navbar>
    </div>
  )
}
export { Header }
