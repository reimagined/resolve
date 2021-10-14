import React, { useState, useEffect } from 'react'

import { useQuery } from '@resolve-js/react-hooks'
import ShoppingLists from './ShoppingLists'

const MyLists = () => {
  const [lists, setLists] = useState({})

  // The 'useQuery' hook is used to querry the 'ShoppingLists' Read Model's 'all' resolver.
  // The obtained data is stored in the component's state.
  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      // Obtain the data on the component's mount.
      setLists(result)
    }
  )
  useEffect(() => {
    getLists()
  }, [])

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: '0 auto',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      <ShoppingLists lists={lists ? lists.data || [] : []} />
    </div>
  )
}

export default MyLists
