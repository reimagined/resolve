import React, { useEffect } from 'react'
import { Button, Form, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useReduxCommand, useReduxReadModel } from '@resolve-js/redux'
import { useSelector } from 'react-redux'
import {
  SHOPPING_LIST_REMOVED,
  SHOPPING_LISTS_ACQUIRED,
} from '../actions/optimistic-actions'

const useOptimisticLists = () => {
  const { request: getLists } = useReduxReadModel(
    {
      name: 'ShoppingLists',
      resolver: 'all',
      args: {},
    },
    [],
    {
      actions: {
        success: (_, result) => ({
          type: SHOPPING_LISTS_ACQUIRED,
          payload: {
            lists: result.data,
          },
        }),
      },
    }
  )
  const { execute: removeShoppingList } = useReduxCommand(
    ({ id }) => ({
      aggregateName: 'ShoppingList',
      type: 'removeShoppingList',
      aggregateId: id,
      payload: {},
    }),
    {
      actions: {
        success: (command) => ({
          type: SHOPPING_LIST_REMOVED,
          payload: {
            id: command.aggregateId,
          },
        }),
      },
    }
  )

  const lists = useSelector<any>((state) => state.optimisticShoppingLists)

  return {
    getLists,
    lists,
    removeShoppingList,
  }
}

const ShoppingLists = () => {
  const { getLists, removeShoppingList, lists } = useOptimisticLists()

  useEffect(() => {
    getLists()
  }, [])

  return (
    <div>
      <Form.Label>My shopping lists</Form.Label>
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Shopping List</th>
            <th className="example-table-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {(lists as any[]).map(({ id, name }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/${id}`}>{name}</Link>
              </td>
              <td className="example-table-action">
                <Button
                  variant="danger"
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

export default ShoppingLists
