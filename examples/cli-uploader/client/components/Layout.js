import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Button } from 'reactstrap'

import Form from '../containers/Form'

export default ({ children, jwt }) => {
  const staticResolver = useStaticResolver()

  return (
    <div>
      <Helmet>
        <title>reSolve cli uploader</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={staticResolver(`/bootstrap.min.css`)} />
        <link rel="icon" href={staticResolver(`/favicon.ico`)} />
      </Helmet>

      <Navbar color="light" light expand="md">
        <NavbarBrand className="mr-auto" href="/">
          <img src={staticResolver(`/resolve-logo.png`)} alt="resolve-logo" />
          Cli uploader
        </NavbarBrand>

        <Nav navbar>
          <Form method="post" action="/api/logout">
            <Button hidden={jwt == null} color="link">
              logout
            </Button>
          </Form>
          <NavItem>
            <NavLink href="https://facebook.com/resolvejs/">
              <img src={staticResolver(`/fb-logo.png`)} alt="fb-logo" />
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://twitter.com/resolvejs">
              <img
                src={staticResolver(`/twitter-logo.png`)}
                alt="twitter-logo"
              />
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://github.com/reimagined/resolve">
              <img src={staticResolver(`/github-logo.png`)} alt="github-logo" />
            </NavLink>
          </NavItem>
        </Nav>
      </Navbar>
      <br />
      {children}
    </div>
  )
}
