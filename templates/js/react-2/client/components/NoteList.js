import React, { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import {
  useCommand,
  useCommandBuilder,
  useQuery,
} from '@resolve-js/react-hooks'
import { Button } from 'react-bootstrap'
import { Note } from './Note'
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
      const event = result
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
      const event = result
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
export { NoteList }
