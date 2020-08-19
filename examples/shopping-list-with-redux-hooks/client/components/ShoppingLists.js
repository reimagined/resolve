import React, { useEffect } from 'react'
import { Button, ControlLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useReduxCommand, useReduxReadModel } from 'resolve-redux'
import { useSelector } from 'react-redux'
import {
  SHOPPING_LIST_REMOVED,
  SHOPPING_LISTS_ACQUIRED
} from '../actions/optimistic_actions'

const useLists = () => {
  const { request: getLists, selector: myLists } = useReduxReadModel(
    {
      name: 'ShoppingLists',
      resolver: 'all',
      args: {}
    },
    [],
    {
      selectorId: 'all-user-lists'
    }
  )
  const { execute: removeShoppingList } = useReduxCommand(({ id }) => ({
    aggregateName: 'ShoppingList',
    type: 'renameShoppingList',
    aggregateId: id,
    payload: {}
  }))

  const { data: lists } = useSelector(myLists)

  return {
    getLists,
    lists,
    removeShoppingList
  }
}

const useOptimisticLists = () => {
  const { request: getLists } = useReduxReadModel(
    {
      name: 'ShoppingLists',
      resolver: 'all',
      args: {}
    },
    [],
    {
      success: (_, result) => ({
        type: SHOPPING_LISTS_ACQUIRED,
        payload: {
          lists: result.data
        }
      })
    }
  )
  const { execute: removeShoppingList } = useReduxCommand(
    ({ id }) => ({
      aggregateName: 'ShoppingList',
      type: 'removeShoppingList',
      aggregateId: id,
      payload: {}
    }),
    {
      success: command => ({
        type: SHOPPING_LIST_REMOVED,
        payload: {
          id: command.aggregateId
        }
      })
    }
  )

  const lists = useSelector(state => state.optimisticShoppingLists)

  return {
    getLists,
    lists,
    removeShoppingList
  }
}

export default () => {
  const { getLists, removeShoppingList, lists } = useLists()

  useEffect(() => {
    getLists()
  }, [])

  return (
    <div>
      <ControlLabel>My shopping lists</ControlLabel>
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Shopping List</th>
            <th className="example-table-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {lists.map(({ id, name }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/${id}`}>{name}</Link>
              </td>
              <td className="example-table-action">
                <Button
                  onClick={() => {
                    removeShoppingList({ id })
                  }}
                >
                  <i className="far fa-trash-alt" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
