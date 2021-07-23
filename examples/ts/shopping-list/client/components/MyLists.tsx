import React, { useState, useEffect } from 'react'

import { useQuery } from '@resolve-js/react-hooks'
import ShoppingLists from './ShoppingLists'
import ShoppingListCreator from './ShoppingListCreator'

const MyLists = () => {
  const [lists, setLists] = useState([])

  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result.data)
    }
  )
  useEffect(() => {
    getLists()
  }, [])

  return (
    <div className="example-wrapper">
      My lists
      <ShoppingLists
        lists={lists || []}
        onRemoveSuccess={(err, result, command) => {
          setLists(lists.filter((list) => list.id !== command.aggregateId))
        }}
      />
      <ShoppingListCreator
        lists={lists || []}
        onCreateSuccess={(err, result) => {
          const nextLists = [...lists]
          nextLists.push({
            name: result.payload.name,
            createdAt: result.timestamp,
            id: result.aggregateId,
          })
          setLists(nextLists)
        }}
      />
    </div>
  )
}

export default MyLists
