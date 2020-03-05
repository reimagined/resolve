import React, { useState } from 'react'
import { Navbar, Image } from 'react-bootstrap'
import { Helmet } from 'react-helmet'

import Test from './containers/Test'

// import CommentTree from './comments/CommentTree'

const Item = ({ aggregateId }) => {
  const [online, setOnline] = useState(1)

  const handleSetOnline = () => {
    setOnline(true)
  }
  const handleSetOffline = () => {
    setOnline(false)
  }

  return (
    <React.Fragment>
      <div style={{ borderTop: '1px solid gray', marginBottom: '20px'}}>
        <button
          onClick={() => {
            handleSetOnline()
          }}
        >
          Go online
        </button>
        <button
          onClick={() => {
            handleSetOffline()
          }}
        >
          Go offline
        </button>
        <code>
          <pre>{aggregateId}</pre>
        </code>
        {online && <Test aggregateId={aggregateId} />}
      </div>
    </React.Fragment>
  )
}

const App = ({ staticPath }) => {
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: `${staticPath}/bootstrap.min.css`
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: `${staticPath}/favicon.ico`
  }
  const links = [stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  }

  return (
    <div>
      <div>
        <Helmet title="ReSolve Hooks Example" link={links} meta={[meta]} />
      </div>
      <Item aggregateId="e526cfa9-6ab2-4ec5-bce6-4a0bd4bb6e4d" />
      <Item aggregateId="6a29bfb6-495e-4d5e-9162-392025b7c887" />
      <Item aggregateId="6a29bfb6-495e-4d5e-9162-392025b7c887" />
      {/* <Item aggregateId="1012029a-94f3-41ca-9536-94e18d91a388" />
      <Item aggregateId="95887203-5173-4151-aeda-d85654b42910" />
      <Item aggregateId="95887203-5173-4151-aeda-d85654b42910" />
      <Item aggregateId="*" /> */}
    </div>
  )
}

export default App
