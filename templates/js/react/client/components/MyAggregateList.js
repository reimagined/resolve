import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import { MyAggregateItems } from './MyAggregateItems'
const MyAggregateList = () => {
  const [entities, setEntities] = useState([])
  const getEntities = useQuery(
    { name: 'MyAggregateList', resolver: 'all', args: {} },
    (error, result) => {
      setEntities(result.data)
    }
  )
  useEffect(() => {
    getEntities()
  }, [])
  const createEntityCommand = useCommand(
    {
      type: 'create',
      aggregateId: uuid(),
      aggregateName: 'MyAggregate',
      payload: { name: `MyAggregate ${entities.length}` },
    },
    (error, result) => {
      const event = result
      setEntities([
        ...entities,
        {
          id: event.aggregateId,
          name: `MyAggregate ${entities.length}`,
          items: [],
        },
      ])
    }
  )
  const deleteEntityCommand = useCommand(
    (id) => ({
      type: 'delete',
      aggregateId: id,
      aggregateName: 'MyAggregate',
    }),
    (error, result) => {
      const event = result
      setEntities([
        ...entities.filter((entity) => entity.id !== event.aggregateId),
      ])
    }
  )
  return (
    <div>
      <Button variant="success" onClick={() => createEntityCommand()}>
        Create Aggregate
      </Button>
      <div className="entities">
        {entities.map(({ id, name }) => (
          <MyAggregateItems
            key={id}
            id={id}
            name={name}
            onDelete={() => deleteEntityCommand(id)}
          />
        ))}
      </div>
    </div>
  )
}
export { MyAggregateList }
