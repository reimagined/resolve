import React, { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { Helmet } from 'react-helmet'
import { Navbar, Image, Nav, Button, Card } from 'react-bootstrap'
import {
  useStaticResolver,
  useQuery,
  useCommand,
  useCommandBuilder,
  useViewModel,
} from '@resolve-js/react-hooks'

const App = () => {
  const staticResolver = useStaticResolver()

  const bootstrapLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/style.css'),
  }
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: staticResolver('/bootstrap.min.css'),
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: staticResolver('/favicon.ico'),
  }
  const links = [bootstrapLink, stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title="reSolve Application" link={links} meta={[meta]} />
      <Navbar>
        <Navbar.Brand href="#home">
          <Image
            src={staticResolver('/resolve-logo.png')}
            className="d-inline-block align-top"
          />{' '}
          reSolveApplicaion
        </Navbar.Brand>
      </Navbar>
      <div className="content-wrapper">
        <EntityList />
      </div>
    </div>
  )
}

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
      const event = result as any
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
      const event = result as any
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
        {entities.map((entity) => (
          <Entity
            key={entity.id}
            id={entity.id}
            name={entity.name}
            onDelete={() => deleteEntityCommand(entity.id)}
          />
        ))}
      </div>
    </div>
  )
}

const Entity = ({ id, name, onDelete }) => {
  const [items, setItems] = useState([])

  const { connect, dispose } = useViewModel('EntityItems', [id], setItems)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  const addItemCommand = useCommand({
    type: 'addItem',
    aggregateId: id,
    aggregateName: 'Entity',
  })

  const removeItemCommand = useCommandBuilder((itemName) => ({
    type: 'removeItem',
    aggregateId: id,
    aggregateName: 'Entity',
    payload: { itemName },
  }))

  return (
    <Card className="entity">
      <Card.Header className="entity-header">
        <span className="entity-name">{name}</span>
        <span>
          <Button variant="success" size="sm" onClick={() => addItemCommand()}>
            Add item
          </Button>
        </span>
        <span>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete entity
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

export default App
