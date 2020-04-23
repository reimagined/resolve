import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand, Row, Col, NavbarText } from 'reactstrap'
import { useStaticResolver, useQuery } from 'resolve-react-hooks'
import { UserProfile } from '../../common/types'

const UserInfo = (props: { user: UserProfile | string | null }): any => {
  const { user } = props

  if (typeof user === 'string') {
    return 'loading'
  }

  if (user === null) {
    return null
  }

  return <span>Signed in as {user.nickname}</span>
}

const Header = () => {
  const asset = useStaticResolver()

  const [user, setUser] = useState<UserProfile | string | null>('unknown')
  const getUser = useQuery(
    {
      name: 'user-profiles',
      resolver: 'profile',
      args: {}
    },
    (err, result) => {
      if (err) {
        setUser(null)
        return
      }
      setUser({ ...result.data.profile, id: result.data.id })
    }
  )
  useEffect(() => {
    getUser()
  }, [])

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
          </Row>
        </NavbarBrand>
        <NavbarText>
          <UserInfo user={user} />
        </NavbarText>
      </Navbar>
    </React.Fragment>
  )
}

export default Header
