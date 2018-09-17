import React from 'react'
import styled from 'styled-components'

const CommentsUpdatesNotificationDiv = styled.div`
  background-color: blue;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  color: white;
  margin-bottom: 1em;
  font-weight: 600;
  padding: 0.5em;
  min-width: 400px;
  max-width: 400px;
`

const CommentsUpdatesNotification = () => (
  <CommentsUpdatesNotificationDiv>
    Comments had been updated - refresh page to see them
  </CommentsUpdatesNotificationDiv>
)

export default CommentsUpdatesNotification
