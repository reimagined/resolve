import React from 'react'
import { Navbar } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { StaticImage } from './StaticImage'
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
        <Navbar.Brand as={Link} to="/">
          <StaticImage className="example-icon" src="/resolve-logo.png" />{' '}
          {name}
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar>
    </div>
  )
}
export default Header
