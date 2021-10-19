import React from 'react'
import { Navbar } from 'react-bootstrap'
import { connectStaticBasedUrls } from '@resolve-js/redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { StaticImage } from './StaticImage'
const Header = ({ title, name, css, favicon }) => {
  const stylesheetLinks = css.map((href) => ({ rel: 'stylesheet', href }))
  const faviconLink = { rel: 'icon', type: 'image/png', href: favicon }
  const links = [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }
  return (
    <div>
      <Helmet title={title} link={links} meta={[meta]} />
      <Navbar collapseOnSelect>
        <Navbar.Brand as={Link} to="/">
          <StaticImage className="example-icon" src="/resolve-logo.png" />{' '}
          {name}
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar>
    </div>
  )
}
const mapStateToProps = (state) => ({
  jwt: state.jwt,
})
export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
