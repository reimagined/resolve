import React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'

export default ({ children }) => {
  const staticResolver = useStaticResolver()

  return (
    <div>
      <Helmet>
        <title>reSolve image gallery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={staticResolver('/bootstrap.min.css')} />
        <link rel="icon" href={staticResolver('/favicon.ico')} />
      </Helmet>

      <Navbar color="light" light="true" expand="md">
        <NavbarBrand className="mr-auto" href="/">
          <img src={staticResolver('/resolve-logo.png')} alt="resolve-logo" />
          Image Gallery
        </NavbarBrand>

        <Nav navbar>
          <NavItem>
            <NavLink href="https://facebook.com/resolvejs/">
              <img src={staticResolver('/fb-logo.png')} alt="fb-logo" />
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://twitter.com/resolvejs">
              <img
                src={staticResolver('/twitter-logo.png')}
                alt="twitter-logo"
              />
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://github.com/reimagined/resolve">
              <img src={staticResolver('/github-logo.png')} alt="github-logo" />
            </NavLink>
          </NavItem>
        </Nav>
      </Navbar>
      <br />
      {children}
    </div>
  )
}
