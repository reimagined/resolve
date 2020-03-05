/* import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useApi } from 'resolve-react-hooks'
import nanoid from 'nanoid'

const randomColour = () => `#${((Math.random() * 0xffffff) << 0).toString(16)}`

const CommentInput = ({ target, targetId }) => {
  const [text, setText] = useState('')
  const [aggregateId, setAggregateId] = useState(nanoid())

  const updateText = useCallback(e => setText(e.target.value), [setText])

  const { execCommand } = useApi()
  const postComment = useCallback(() => {
    execCommand(
      {
        type: 'create',
        aggregateName: 'comment',
        aggregateId,
        payload: {
          target,
          targetId,
          text
        }
      },
      {
        retryOnError: {
          attempts: 3,
          period: 1000,
          errors: [409]
        },
        debug: true
      },
      (error, result) => {
        if (error) {
          console.log(`Truba: ${JSON.stringify(error.message, null, 2)}`)
          return
        }
        console.log(`Norm: ${JSON.stringify(result, null, 2)}`)
        setAggregateId(nanoid())
      }
    )
  }, [text, execCommand, aggregateId])

  const postCommentAsync = useCallback(() => {
    const exec = async () => {
      try {
        const result = await execCommand(
          {
            type: 'create',
            aggregateName: 'comment',
            aggregateId,
            payload: {
              target,
              targetId,
              text
            }
          },
          {
            retryOnError: {
              attempts: 3,
              period: 1000,
              errors: [409]
            },
            debug: true
          }
        ).promise()

        console.log(`Norm: ${JSON.stringify(result, null, 2)}`)
        setAggregateId(nanoid())
      } catch (error) {
        console.log(`Truba: ${error}`)
      }
    }

    exec()
  }, [text, execCommand, aggregateId])

  // memo does not make sense here - just for testing
  return useMemo(() => {
    return (
      <div>
        <input onChange={updateText} />
        <button style={{ background: randomColour() }} onClick={postComment}>
          post with callbacks
        </button>
        <button style={{ background: randomColour() }} onClick={postCommentAsync}>
          post with async
        </button>
      </div>
    )
  }, [postComment, setText])
}

const CommentList = ({ target = 'system', targetId = 'root' }) => {
  const [comments, setComments] = useState([])
  const [error, setError] = useState(null)
  const [updated, setUpdated] = useState(Date.now())
  const { queryReadModel } = useApi()

  useEffect(() => {
    queryReadModel(
      {
        readModelName: 'comments',
        resolverName: 'getComments',
        resolverArgs: {
          target,
          targetId
        }
      },
      {
        retryOnError: {
          period: 1000,
          attempts: 5,
          errors: [404]
        },
        debug: true
      },
      (err, result) => {
        if (err) {
          setError(err)
          return
        }
        if (result) {
          setComments(result.data)
        }
      }
    )
  }, [updated])
  const update = useCallback(() => setUpdated(Date.now()), [updated])

  if (error) {
    return <h1>error.message</h1>
  }

  return (
    <div>
      <button onClick={update}>refresh</button>
      <ul>
        {comments.map(({ text, id }) => (
          <li key={id}>{text.toString()}</li>
        ))}
      </ul>
    </div>
  )
}

const SystemStatus = ({ targetId }) => {
  const [state, setState] = useState({
    comments: 'n/a'
  })
  const [events] = useState([])
  const { bindViewModel } = useApi()

  bindViewModel(
    {
      viewModelName: 'system',
      aggregateIds: '*',
      aggregateArgs: {}
    },
    {
      onStateChange: data => {
        console.log(data)
        setState(data)
      },
      onEvent: event => {
        console.log(event)
        events.push(event)
        return event
      }
    }
  )

  return (
    <div>
      <span>
        System comments: {state.comments}/(reactive {events.length})
      </span>
    </div>
  )
}

const CommentTree = ({ target = 'system', targetId = 'root' }) => {
  return (
    <div>
      <div>Target: {target}</div>
      <div>TargetID: {targetId}</div>
      <SystemStatus targetId={targetId} />
      <br />
      <CommentInput target={target} targetId={targetId} />
      <br />
      <CommentList target={target} targetId={targetId} />
    </div>
  )
}

export default CommentTree
 */
