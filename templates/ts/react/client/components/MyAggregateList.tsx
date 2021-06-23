import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import { MyAggregateItems } from './MyAggregateItems'

const MyAggregateList = () => {
  const [aggregates, setAggregates] = useState([])

  const getEntities = useQuery(
    { name: 'MyAggregateList', resolver: 'all', args: {} },
    (error, result) => {
      setAggregates(result.data)
    }
  )

  useEffect(() => {
    getEntities()
  }, [])

  const createAggregate = useCommand(
    {
      type: 'create',
      aggregateId: uuid(),
      aggregateName: 'MyAggregate',
      payload: { name: `MyAggregate ${aggregates.length}` },
    },
    (error, result) => {
      const event = result as any
      setAggregates([
        ...aggregates,
        {
          id: event.aggregateId,
          name: `MyAggregate ${aggregates.length}`,
          items: [],
        },
      ])
    }
  )

  const deleteAggregate = useCommand(
    (id) => ({
      type: 'delete',
      aggregateId: id,
      aggregateName: 'MyAggregate',
    }),
    (error, result) => {
      const event = result as any
      setAggregates([
        ...aggregates.filter((entity) => entity.id !== event.aggregateId),
      ])
    }
  )

  return (
    <div>
      <Button variant="success" onClick={() => createAggregate()}>
        Create Aggregate
      </Button>
      <div className="entities">
        {aggregates.map(({ id, name }) => (
          <MyAggregateItems
            key={id}
            id={id}
            name={name}
            onDelete={() => deleteAggregate(id)}
          />
        ))}
      </div>
    </div>
  )
}

export { MyAggregateList }
