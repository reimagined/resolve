import React from 'react'
import { Navbar, Nav, NavItem as RawNavItem } from 'react-bootstrap'
import { connectStaticBasedUrls, connectRootBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import Image from './Image'

const NavItem = connectRootBasedUrls(['href'])(RawNavItem)

const Header = ({ title, name, css, favicon, shoppingListId, jwt }) => (
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
      <Navbar.Header>
        <Navbar.Brand>
          <Link to={`/${jwt.id}`}>
            <Image className="example-icon" src="/resolve-logo.png" /> {name}
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Navbar.Collapse>
        <Nav>
          <NavItem eventKey={1} href="/all">
            My Lists
          </NavItem>
          {shoppingListId &&
          ['all', 'share', 'settings'].indexOf(shoppingListId) === -1 ? (
            <NavItem eventKey={2} href={`/share/${shoppingListId}`}>
              Share
            </NavItem>
          ) : null}
        </Nav>
        <Nav pullRight>
          {jwt.id ? (
            <NavItem eventKey={3} href="/settings">
              Settings
            </NavItem>
          ) : null}
          {jwt.id ? (
            <NavItem
              eventKey={4}
              href="/auth/logout?username=logout&&password=logout"
            >
              <Image className="example-icon" src="/logout.svg" /> Logout
            </NavItem>
          ) : null}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  </div>
)

const mapStateToProps = state => ({
  jwt: state.jwt
})

export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
