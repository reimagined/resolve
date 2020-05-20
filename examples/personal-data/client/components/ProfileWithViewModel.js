import React, { useState, useEffect } from 'react'
import { useViewModel } from 'resolve-react-hooks'
import { Redirect } from 'react-router-dom'
import Login from './Login'
import Loading from './Loading'

const ProfileWithViewModel = ({ userId }) => {
  const [user, setUser] = useState('unknown')

  const { connect, dispose } = useViewModel(
    'current-user-profile',
    [userId],
    setUser
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
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

export default ProfileWithViewModel
