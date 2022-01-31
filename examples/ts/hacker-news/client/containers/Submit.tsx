import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { useReduxCommand } from '@resolve-js/redux'

import { StoreState, UserState } from '../../types'

const FormLabel = styled.div`
  margin-bottom: 0.1em;
`

const FormInput = styled.input`
  margin-bottom: 1em;
`

const FormTextArea = styled.textarea`
  margin-bottom: 1em;
`

const SubmitButton = styled.button`
  margin-bottom: 1em;
`

const Submit = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [text, setText] = useState('')
  const [disabled, setDisabled] = useState(false)

  const { execute: createStory } = useReduxCommand((storyId, payload) => ({
    aggregateId: storyId,
    aggregateName: 'Story',
    type: 'createStory',
    payload,
  }))

  const handleSubmit = useCallback(() => {
    setDisabled(!disabled)
    createStory(uuid(), {
      title,
      text,
      link,
    })
  }, [createStory])

  const me = useSelector<StoreState, UserState>((state) => state.jwt)

  if (!me?.id && typeof window !== 'undefined') {
    return <Navigate to="/login?redirect=/submit" />
  }

  return (
    <div>
      <div>
        <FormLabel>title:</FormLabel>
        <FormInput
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <FormLabel>url:</FormLabel>
        <FormInput
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <FormLabel>text:</FormLabel>
        <FormTextArea
          name="text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <SubmitButton disabled={disabled} onClick={handleSubmit}>
          {disabled ? 'Please wait...' : 'submit'}
        </SubmitButton>
      </div>
      <div>
        Leave url blank to submit a question for discussion. If there is no url,
        the text (if any) will appear at the top of the thread.
      </div>
    </div>
  )
}

export { Submit }
