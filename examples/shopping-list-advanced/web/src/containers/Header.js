import React from 'react'
import { Navbar, Nav, NavItem as RawNavItem } from 'react-bootstrap'
import { connectStaticBasedUrls, connectRootBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Logo } from '@shopping-list-advanced/ui'

import Image from './Image'

const NavItem = connectRootBasedUrls(['href'])(RawNavItem)

const Header = ({ title, name, css, favicon, jwt }) => (
  <div>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href={favicon} type="image/png" />
      {css.map((href, index) => (
        <link rel="stylesheet" href={href} key={index} />
      ))}
      <title>{title}</title>
    </Helmet>
    <Navbar collapseOnSelect>
      <Logo />
      {jwt.id ? (
        <Navbar.Collapse>
          <Nav>
            <NavItem eventKey={1} href="/">
              My Lists
            </NavItem>
          </Nav>
          <Nav pullRight>
            <NavItem eventKey={2} href="/settings">
              Settings
            </NavItem>
            <NavItem
              eventKey={3}
              href="/auth/logout?username=logout&&password=logout"
            >
              <Image className="example-icon" src="/logout.svg" /> Logout
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      ) : null}
    </Navbar>
  </div>
)

const mapStateToProps = state => ({
  jwt: state.jwt
})

export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
