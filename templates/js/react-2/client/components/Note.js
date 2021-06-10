import { useViewModel } from '@resolve-js/react-hooks'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
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
    var _a
    ;(_a =
      textarea === null || textarea === void 0 ? void 0 : textarea.current) ===
      null || _a === void 0
      ? void 0
      : _a.focus()
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
          Last modified at{' '}
          {modifiedAt === null || modifiedAt === void 0
            ? void 0
            : modifiedAt.toLocaleString()}
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
export { Note }
