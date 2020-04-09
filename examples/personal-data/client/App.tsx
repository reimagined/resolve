import * as React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand, Row, Col } from 'reactstrap'
import { useStaticResolver, useQuery } from 'resolve-react-hooks'
import { useEffect, useState } from 'react'
import { UserProfile } from '../common/types'
import Login from './Login'
import Loading from './Loading'
import UserBlog from './UserBlog'

const BrandSelector = (props: { user: UserProfile | string | null }): any => {
  const { user } = props
  const asset = useStaticResolver()

  if (typeof user === 'string') {
    return <img src={asset('/loading.gif') as string} alt="loading" />
  }
  if (user === null) {
    return null
  }
  return <div>${user.nickname}'s blog</div>
}

const ContentSelector = (props: { user: UserProfile | string | null }): any => {
  const { user } = props

  if (typeof user === 'string') {
    return <Loading />
  }
  if (user === null) {
    return <Login />
  }
  return <UserBlog user={user} />
}

const App = (): any => {
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
      setUser(result.data)
    }
  )
  useEffect(() => {
    getUser()
  }, [getUser])

  return (
    <div>
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
      <ContentSelector user={user} />
    </div>
  )
}

export default App
