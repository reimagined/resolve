import React from 'react'
import { Navbar, Nav, NavItem as RawNavItem } from 'react-bootstrap'
import { connectStaticBasedUrls, connectRootBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Logo } from '@shopping-list-advanced/ui'

import Image from './Image'

const NavItem = connectRootBasedUrls(['href'])(RawNavItem)

const Header = ({ title, css, favicon, jwt }) => {
  const stylesheetLinks = css.map(href => ({ rel: 'stylesheet', href }))
  const faviconLink = { rel: 'icon', type: 'image/png', href: favicon }
  const links = [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  }

  return (
    <div>
      <Helmet title={title} link={links} meta={[meta]} />
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
                href="/api/auth/local/logout?username=logout&&password=logout"
              >
                <Image className="example-icon" src="/logout.svg" /> Logout
              </NavItem>
            </Nav>
          </Navbar.Collapse>
        ) : null}
      </Navbar>
    </div>
  )
}

const mapStateToProps = state => ({
  jwt: state.jwt
})

export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
