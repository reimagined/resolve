import {
  useCommand,
  useCommandBuilder,
  useViewModel,
} from '@resolve-js/react-hooks'
import React, { useState, useEffect } from 'react'
import { Button, Card } from 'react-bootstrap'
const MyAggregateItems = ({ id, name, onDelete }) => {
  const [items, setItems] = useState([])
  const { connect, dispose } = useViewModel('MyAggregateItems', [id], setItems)
  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])
  const addItemCommand = useCommand({
    type: 'addItem',
    aggregateId: id,
    aggregateName: 'MyAggregate',
  })
  const removeItemCommand = useCommandBuilder((itemName) => ({
    type: 'removeItem',
    aggregateId: id,
    aggregateName: 'MyAggregate',
    payload: { itemName },
  }))
  return (
    <Card className="entity">
      <Card.Header className="entity-header">
        <span className="entity-name">{name}</span>
        <span>
          <Button variant="success" size="sm" onClick={() => addItemCommand()}>
            Add Item
          </Button>
        </span>
        <span>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete Aggregate
          </Button>
        </span>
      </Card.Header>
      <Card.Body className="entity-items">
        <div className="entity-items-content">
          {items.map((item) => (
            <div className="entity-item" key={item}>
              <span>{item}</span>
              <span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeItemCommand(item)}
                >
                  Delete
                </Button>
              </span>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}
export { MyAggregateItems }
