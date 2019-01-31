import React from 'react'
import { Navbar } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import Image from './Image'

const Header = ({ title, name, css, favicon }) => {
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
        <Navbar.Header>
          <Navbar.Brand>
            <Link to="/">
              <Image className="example-icon" src="/resolve-logo.png" /> {name}
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
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
