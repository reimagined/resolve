import React from 'react'
import { Navbar, Nav } from 'react-bootstrap'
import { connectStaticBasedUrls, connectRootBasedUrls } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
//import { Logo } from '@shopping-list-advanced/ui'

//import Image from './Image'

//const NavItem = connectRootBasedUrls(['href'])(Navbar.Text)

const Header = ({ title, css, favicon, jwt }) => {
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
      <Navbar/>
    </div>
  )
}

const mapStateToProps = (state) => ({
  jwt: state.jwt,
})

export default connectStaticBasedUrls(['css', 'favicon'])(
  connect(mapStateToProps)(Header)
)
