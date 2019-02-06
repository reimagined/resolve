import React from 'react'
import { connectStaticBasedUrls } from 'resolve-redux'
import { Helmet } from 'react-helmet'

const Header = ({ title, css, favicon }) => {
  const stylesheetLinks = css.map(href => ({ rel: 'stylesheet', href }))
  const faviconLink = { rel: 'icon', type: 'image/png', href: favicon }
  const links = [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  }
  return <Helmet title={title} link={links} meta={[meta]} />
}

export default connectStaticBasedUrls(['css', 'favicon'])(Header)
