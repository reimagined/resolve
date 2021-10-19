import React from 'react'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { Helmet } from 'react-helmet'
const Header = ({ title, css, favicon }) => {
  const asset = useStaticResolver()
  const stylesheetLinks = css.map((sheet) => ({
    rel: 'stylesheet',
    href: asset(sheet),
  }))
  const faviconLink = { rel: 'icon', type: 'image/png', href: asset(favicon) }
  const links = [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }
  return <Helmet title={title} link={links} meta={[meta]} />
}
export { Header }
