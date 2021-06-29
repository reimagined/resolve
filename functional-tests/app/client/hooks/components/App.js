import React from 'react'
import { renderRoutes } from 'react-router-config'
import { Helmet } from 'react-helmet'
import { useStaticResolver } from '@resolve-js/react-hooks'

const App = ({ version, children, route }) => {
  const resolveStatic = useStaticResolver()

  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: resolveStatic(`/bootstrap.min.css`),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: resolveStatic(`/favicon.png`),
  }
  const links = [stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title="React Hooks Tests" link={links} meta={[meta]} />
      <h6 align="left">
        {version != null && version.length > 0 ? `Version ${version}` : ``}
      </h6>
      {renderRoutes(route.routes)}
      {children}
    </div>
  )
}

export { App }
