import React from 'react'
// The react-helmet library allows you to manage the document *head* section.
import { Helmet } from 'react-helmet'
import { useStaticResolver } from '@resolve-js/react-hooks'

const Header = ({ title, css }) => {
  // Use the *useStaticResolver* hook to obtain the full path to a static resource
  // from a relative path.
  const resolveStatic = useStaticResolver()

  // Generate a list of links for stylesheets.
  const stylesheetLinks = css.map((href) => ({
    rel: 'stylesheet',
    href: resolveStatic(href),
  }))

  // You can use the same technique to generate links for other resource types.
  // const faviconLink = {
  //   rel: 'icon',
  //   type: 'image/png',
  //   href: resolveStatic(favicon),
  // }

  // Merge all links together in one list.
  const links = [...stylesheetLinks] // [...stylesheetLinks, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  // Use react-helmet to render the *head* section with your settings.
  return (
    <div>
      <Helmet title={title} link={links} meta={[meta]} />
    </div>
  )
}
export default Header
