import React, { useState, useEffect } from 'react'
import { useViewModel } from 'resolve-react-hooks'
import { Redirect } from 'react-router-dom'
import { getDecrypter } from '../../common/encryption-factory'
import Login from './Login'
import Loading from './Loading'

const ProfileWithViewModel = ({ userId }) => {
  console.log(`using user state`)

  const [user, setUser] = useState('unknown')

  console.log(`building view model connect callback`)

  const onViewModelConnected = user => {
    fetch(`/api/personal-data-keys/${user.id}`)
      .then(response => response.text())
      .then(key => {
        const decrypt = getDecrypter(key)

        setUser({
          ...user,
          firstName: decrypt(user.firstName),
          lastName: decrypt(user.lastName),
          contacts: decrypt(user.contacts)
        })
      })
  }

  console.log(`using view model hook`)

  const { connect, dispose } = useViewModel(
    'current-user-profile',
    [userId],
    onViewModelConnected
  )

  console.log(`using effect`)

  useEffect(() => {
    console.log('connecting view model')
    connect()
    return () => {
      console.log('disposing view model')
      dispose()
    }
  }, [])

  if (typeof user === 'string') {
    console.log('return Loading')
    return <Loading />
  }

  if (user === null) {
    console.log('return Redirection')
    return <Redirect to="/" />
  }

  console.log('return Login')
  return (
    <React.Fragment>
      <Login user={user} />
    </React.Fragment>
  )
}

export default ProfileWithViewModel
