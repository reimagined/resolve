import React from 'react'
import { Navbar } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import Image from './Image'

const Header = ({ title, name, css, favicon }) => (
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
          <Link to="/">
            <Image className="example-icon" src="/resolve-logo.png" /> {name}
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
    </Navbar>
  </div>
)

const mapStateToProps = state => ({
  jwt: state.jwt
})

export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
