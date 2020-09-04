import React, { useState, useEffect } from 'react'

import { useQuery } from 'resolve-react-hooks'
import ShoppingLists from './ShoppingLists'
import ShoppingListCreator from './ShoppingListCreator'

const MyLists = () => {
  const [lists, setLists] = useState({})

  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result)
    }
  )
  useEffect(() => {
    getLists()
  }, [])

  return (
    <div className="example-wrapper">
      My lists
      <ShoppingLists
        lists={lists ? lists.data || [] : []}
        onRemoveSuccess={(err, result) => {
          setLists({
            ...lists,
            data: lists.data.filter((list) => list.id !== result.aggregateId),
          })
        }}
      />
      <ShoppingListCreator
        lists={lists ? lists.data || [] : []}
        onCreateSuccess={(err, result) => {
          const nextLists = { ...lists }
          nextLists.data.push({
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
