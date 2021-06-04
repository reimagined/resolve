import React, { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router'
import styled from 'styled-components'
import { useReduxCommand } from '@resolve-js/redux'
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
  const me = useSelector((state) => state.jwt)
  if (!(me === null || me === void 0 ? void 0 : me.id)) {
    return React.createElement(Redirect, { to: '/login?redirect=/submit' })
  }
  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      null,
      React.createElement(FormLabel, null, 'title:'),
      React.createElement(FormInput, {
        type: 'text',
        value: title,
        onChange: (e) => setTitle(e.target.value),
        disabled: disabled,
      })
    ),
    React.createElement(
      'div',
      null,
      React.createElement(FormLabel, null, 'url:'),
      React.createElement(FormInput, {
        type: 'text',
        value: link,
        onChange: (e) => setLink(e.target.value),
        disabled: disabled,
      })
    ),
    React.createElement(
      'div',
      null,
      React.createElement(FormLabel, null, 'text:'),
      React.createElement(FormTextArea, {
        name: 'text',
        rows: '4',
        value: text,
        onChange: (e) => setText(e.target.value),
        disabled: disabled,
      })
    ),
    React.createElement(
      'div',
      null,
      React.createElement(
        SubmitButton,
        { disabled: disabled, onClick: handleSubmit },
        disabled ? 'Please wait...' : 'submit'
      )
    ),
    React.createElement(
      'div',
      null,
      'Leave url blank to submit a question for discussion. If there is no url, the text (if any) will appear at the top of the thread.'
    )
  )
}
export { Submit }
