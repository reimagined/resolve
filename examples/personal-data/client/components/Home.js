import * as React from 'react'
import { useQuery } from 'resolve-react-hooks'
import { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'

import Login from './Login'
import Loading from './Loading'

const ContentSelector = ({ user }) => {
  if (typeof user === 'string') {
    return <Loading />
  }

  if (user === null) {
    return <Login />
  }

  return <Redirect to={`/blog/${user.id}`} />
}

const Home = () => {
  const [user, setUser] = useState('unknown')
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
      if (result.data !== null) {
        setUser({ ...result.data.profile, id: result.data.id })
      } else {
        setUser(null)
      }
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
