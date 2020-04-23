import * as React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand, Row, Col } from 'reactstrap'
import { useStaticResolver, useQuery } from 'resolve-react-hooks'
import { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import { UserProfile } from '../../common/types'
import Login from './Login'
import Loading from './Loading'
import Header from './Header'

const ContentSelector = (props: { user: UserProfile | string | null }): any => {
  const { user } = props

  if (typeof user === 'string') {
    return 'loading'
  }

  if (user === null) {
    return <Login />
  }

  return <Redirect to={`/blog/${user.id}`} />
}

const Home = () => {
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
      <ContentSelector user={user} />
    </React.Fragment>
  )
}

export default Home
