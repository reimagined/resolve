import React from 'react'
import { connectStaticBasedUrls } from 'resolve-redux'
import { Helmet } from 'react-helmet'

const Header = ({ title, css, favicon }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href={favicon} type="image/png" />
    {css.map((href, index) => (
      <link rel="stylesheet" href={href} key={index} />
    ))}
  </Helmet>
)

export default connectStaticBasedUrls(['css', 'favicon'])(Header)
