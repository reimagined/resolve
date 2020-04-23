import React, { useState, useEffect } from 'react'
import { useQuery } from 'resolve-react-hooks'
import { Container, Row, Col } from 'reactstrap'

import Login from './Login'
import Loading from './Loading'

const Profile = () => {
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

  if (typeof user === 'string') {
    return <Loading />
  }

  if (user === null) {
    return <Redirect to="/" />
  }

  return (
    <React.Fragment>
      <Login user={user} />
    </React.Fragment>
  )
}

export default Profile
