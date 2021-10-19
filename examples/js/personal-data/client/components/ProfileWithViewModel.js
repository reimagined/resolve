import React, { useState, useEffect } from 'react'
import { useViewModel } from '@resolve-js/react-hooks'
import { Redirect } from 'react-router-dom'
import { getDecrypter } from '../../common/encryption-factory'
import Login from './Login'
import Loading from './Loading'
const ProfileWithViewModel = ({ userId }) => {
  const [user, setUser] = useState('unknown')
  const viewModelStateChanged = (user, initial) => {
    if (!initial) {
      fetch(`/api/personal-data-keys/${user.id}`)
        .then((response) => response.text())
        .then((key) => {
          const decrypt = getDecrypter(key)
          setUser({
            ...user,
            firstName: decrypt(user.firstName),
            lastName: decrypt(user.lastName),
            contacts: decrypt(user.contacts),
          })
        })
    }
  }
  const { connect, dispose } = useViewModel(
    'current-user-profile',
    [userId],
    viewModelStateChanged
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
  if (user == null) {
    return <Redirect to="/" />
  }
  return (
    <React.Fragment>
      <Login user={user} />
    </React.Fragment>
  )
}
export default ProfileWithViewModel
