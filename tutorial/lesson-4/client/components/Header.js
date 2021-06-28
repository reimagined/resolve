import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticResolver } from '@resolve-js/react-hooks'

const Header = ({ title, css }) => {
  const resolveStatic = useStaticResolver()
  const stylesheetLinks = css.map((href) => ({
    rel: 'stylesheet',
    href: resolveStatic(href),
  }))
  const links = [...stylesheetLinks]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title={title} link={links} meta={[meta]} />
    </div>
  )
}

export default Header
