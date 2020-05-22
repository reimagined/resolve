import React, { useState, useEffect } from 'react'
import { useViewModel } from 'resolve-react-hooks'
import { Redirect } from 'react-router-dom'
import { decrypt } from '../../common/encryption-factory'
import Login from './Login'
import Loading from './Loading'

const ProfileWithViewModel = ({ userId }) => {
  const [user, setUser] = useState('unknown')

  const onViewModelConnected = user => {
    fetch(`/api/personal-data-keys/${user.id}`)
      .then(response => response.text())
      .then(key => {
        setUser({
          ...user,
          firstName: decrypt(key, user.firstName),
          lastName: decrypt(key, user.lastName),
          contacts: decrypt(key, user.contacts)
        })
      })
  }
  const { connect, dispose } = useViewModel(
    'current-user-profile',
    [userId],
    onViewModelConnected
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
