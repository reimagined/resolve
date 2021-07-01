import React, { useState, useEffect } from 'react'

import { useReadModelChannel } from '@resolve-js/react-hooks'
import ShoppingLists from './ShoppingLists'
import ShoppingListCreator from './ShoppingListCreator'

const MyLists = () => {
  const [lists, setLists] = useState([])

  const { connect, dispose } = useReadModelChannel(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    [],
    (notification) => {
      setLists(notification)
    },
    (result) => {
      setLists(result.data)
    }
  )
  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div className="example-wrapper">
      My lists
      <ShoppingLists lists={lists || []} />
      <ShoppingListCreator lists={lists || []} />
    </div>
  )
}

export default MyLists
