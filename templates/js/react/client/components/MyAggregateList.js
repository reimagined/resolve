import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import { MyAggregateItems } from './MyAggregateItems'
const MyAggregateList = () => {
  const [aggregates, setAggregates] = useState([])
  const getMyAggregates = useQuery(
    { name: 'MyAggregateList', resolver: 'all', args: {} },
    (error, result) => {
      setAggregates(result.data)
    }
  )
  useEffect(() => {
    getMyAggregates()
  }, [])
  const createAggregate = useCommand(
    {
      type: 'create',
      aggregateId: uuid(),
      aggregateName: 'MyAggregate',
      payload: { name: `MyAggregate ${aggregates.length}` },
    },
    (error, result, { aggregateId }) => {
      setAggregates([
        ...aggregates,
        {
          id: aggregateId,
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
    (error, result, { aggregateId }) => {
      setAggregates([
        ...aggregates.filter((aggregate) => aggregate.id !== aggregateId),
      ])
    }
  )
  return (
    <div>
      <Button variant="success" onClick={() => createAggregate()}>
        Create Aggregate
      </Button>
      <div className="my-aggregates">
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
