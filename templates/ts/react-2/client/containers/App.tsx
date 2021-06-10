import React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, Image } from 'react-bootstrap'
import { useStaticResolver } from '@resolve-js/react-hooks'
import { NoteList } from '../components/NoteList'

const App = () => {
  const staticResolver = useStaticResolver()

  const bootstrapLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/style.css'),
  }
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/bootstrap.min.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.ico'),
  }
  const links = [bootstrapLink, stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title="reSolve Application" link={links} meta={[meta]} />
      <Navbar>
        <Navbar.Brand href="#home">
          <Image
            src={staticResolver('/resolve-logo.png')}
            className="d-inline-block align-top"
          />
          <span>{' reSolve Application'}</span>
        </Navbar.Brand>
      </Navbar>
      <div className="content-wrapper">
        <NoteList />
      </div>
    </div>
  )
}

export default App