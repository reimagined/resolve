import generateCodeName from 'project-name-generator'

const ITEMS_COUNT = 100

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))

const rand = max => Math.floor(Math.random() * max)

const upFirstLetter = string => {
  return string.replace(/\w\S*/g, function(text) {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  })
}

async function mainSagaImpl(executeCommand, pushInterval) {
  for (let idx of Array.from(Array(ITEMS_COUNT)).map((_, idx) => idx)) {
    await executeCommand({
      aggregateId: 'root-id',
      aggregateName: 'Rating',
      type: 'append',
      payload: {
        id: `Item${idx}`,
        name: upFirstLetter(generateCodeName().spaced)
      }
    })
  }

  while (true) {
    await executeCommand({
      aggregateId: 'root-id',
      aggregateName: 'Rating',
      type: rand(2) === 0 ? 'upvote' : 'downvote',
      payload: {
        id: `Item${rand(ITEMS_COUNT)}`,
        userId: `User${rand(ITEMS_COUNT)}`
      }
    })

    await delay(pushInterval)
  }
}

function mainSaga({ resolve: { executeCommand } }) {
  const pushInterval =
    Number.isSafeInteger(+process.env.PUSH_INTERVAL) &&
    +process.env.PUSH_INTERVAL > 10 &&
    +process.env.PUSH_INTERVAL < 3000
      ? +process.env.PUSH_INTERVAL
      : 300

  mainSagaImpl(executeCommand, pushInterval).catch(error => {
    // eslint-disable-next-line no-console
    console.log('Saga error:', error)
  })
}

export default [mainSaga]
