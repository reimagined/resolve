import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { Helmet } from 'react-helmet'
import { Navbar, Image, Button, Card, Form } from 'react-bootstrap'
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
          />
          <span>{' reSolve Application'}</span>
        </Navbar.Brand>
      </Navbar>
      <div className="content-wrapper">
        <NoteList />
      </div>
    </div>
  )
}

const NoteList = () => {
  const [notes, setNotes] = useState([])
  const [currentlyEditing, setCurrentlyEditing] = useState(null)

  const getNotes = useQuery(
    { name: 'Notes', resolver: 'all', args: {} },
    (error, result) => {
      setNotes(result.data.map((note) => note.id))
    }
  )

  useEffect(() => {
    getNotes()
  }, [])

  const createNoteCommand = useCommand(
    {
      type: 'createNote',
      aggregateId: uuid(),
      aggregateName: 'Note',
    },
    (error, result) => {
      const event = result as any
      setNotes([...notes, event.aggregateId])
      setCurrentlyEditing(event.aggregateId)
    }
  )

  const modifyNoteCommand = useCommandBuilder(
    (id, text) => ({
      type: 'modifyNote',
      aggregateId: id,
      aggregateName: 'Note',
      payload: { text },
    }),
    () => setCurrentlyEditing(null)
  )

  const deleteNoteCommand = useCommand(
    (id) => ({
      type: 'deleteNote',
      aggregateId: id,
      aggregateName: 'Note',
    }),
    (error, result) => {
      const event = result as any
      setNotes([...notes.filter((id) => id !== event.aggregateId)])
    }
  )

  return (
    <div>
      <Button variant="success" onClick={() => createNoteCommand()}>
        Create note
      </Button>
      <div className="notes">
        {notes.map((noteId) => (
          <Note
            key={noteId}
            id={noteId}
            editMode={noteId === currentlyEditing}
            onStartEdit={() => setCurrentlyEditing(noteId)}
            onDelete={() => deleteNoteCommand(noteId)}
            onSave={(text) => modifyNoteCommand(noteId, text)}
          />
        ))}
      </div>
    </div>
  )
}

const Note = ({ id, editMode, onStartEdit, onDelete, onSave }) => {
  const [text, setText] = useState('')
  const [modifiedAt, setModifiedAt] = useState(null)

  const setNote = (note) => {
    setText(note.text)
    setModifiedAt(new Date(note.modifiedAt))
  }

  const { connect, dispose } = useViewModel('NoteText', [id], setNote)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  const textarea = useRef(null)

  useEffect(() => {
    textarea?.current?.focus()
  }, [editMode])

  const toggleEdit = () => {
    editMode ? onSave(text) : onStartEdit()
  }
  return (
    <Card className="note">
      <Card.Body>
        {editMode ? (
          <Form>
            <Form.Group controlId="noteForm.noteTextarea">
              <Form.Control
                ref={textarea}
                as="textarea"
                rows={3}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                }}
              />
            </Form.Group>
          </Form>
        ) : (
          <div>{text}</div>
        )}
      </Card.Body>
      <Card.Footer className="note-footer">
        <span className="note-last-modified">
          Last modified at {modifiedAt?.toLocaleString()}
        </span>
        <span>
          <Button variant="success" size="sm" onClick={toggleEdit}>
            {editMode ? 'Save' : 'Edit'}
          </Button>
        </span>
        <span>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete note
          </Button>
        </span>
      </Card.Footer>
    </Card>
  )
}

export default App
