import React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand, Row, Col } from 'reactstrap'
import { useStaticResolver } from 'resolve-react-hooks'
import { UserProfile } from '../../common/types'

const BrandSelector = (props: { user: UserProfile | string | null }): any => {
  const { user } = props

  if (typeof user === 'string') {
    return 'loading'
  }

  if (user === null) {
    return null
  }

  return <div>Signed in as {user.nickname}</div>
}

const Header = ({ user }) => {
  const asset = useStaticResolver()
  return (
    <React.Fragment>
      <Helmet>
        <title>Personal Blog Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={asset('/bootstrap.min.css') as string} />
        <link rel="icon" href={asset('/favicon.ico') as string} />
      </Helmet>

      <Navbar color="light" light expand="md">
        <NavbarBrand className="mr-auto" href="/">
          <Row>
            <Col>
              <img
                src={asset('/resolve-logo.png') as string}
                alt="resolve-logo"
              />
            </Col>
            <Col>{BrandSelector({ user })}</Col>
          </Row>
        </NavbarBrand>
      </Navbar>
    </React.Fragment>
  )
}

export default Header
