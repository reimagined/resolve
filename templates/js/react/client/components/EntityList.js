import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import { Entity } from './Entity'
const EntityList = () => {
  const [entities, setEntities] = useState([])
  const getEntities = useQuery(
    { name: 'Entities', resolver: 'all', args: {} },
    (error, result) => {
      setEntities(result.data)
    }
  )
  useEffect(() => {
    getEntities()
  }, [])
  const createEntityCommand = useCommand(
    {
      type: 'createEntity',
      aggregateId: uuid(),
      aggregateName: 'Entity',
      payload: { name: `Entity ${entities.length}` },
    },
    (error, result) => {
      const event = result
      setEntities([
        ...entities,
        { id: event.aggregateId, name: `Entity ${entities.length}`, items: [] },
      ])
    }
  )
  const deleteEntityCommand = useCommand(
    (id) => ({
      type: 'deleteEntity',
      aggregateId: id,
      aggregateName: 'Entity',
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
        Create entity
      </Button>
      <div className="entities">
        {entities.map(({ id, name }) => (
          <Entity
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
export { EntityList }
