import React from 'react'
import { Navbar, NavbarBrand } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { useStaticResolver } from 'resolve-react-hooks'

import Image from './Image'

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
      <Navbar collapseOnSelect>
        <NavbarBrand>
          <Link to="/">
            <Image className="example-icon" src="/resolve-logo.png" /> {name}
          </Link>
        </NavbarBrand>
        <Navbar.Toggle />
      </Navbar>
    </div>
  )
}

export default Header
