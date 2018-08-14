import generateCodeName from 'project-name-generator'

const ITEMS_COUNT = 30
const rand = max => Math.floor(Math.random() * max)

const upFirstLetter = string => {
  return string.replace(/\w\S*/g, function(text) {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
  })
}

async function appendRating(executeCommand) {
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
}

async function processRating(executeCommand) {
  await executeCommand({
    aggregateId: 'root-id',
    aggregateName: 'Rating',
    type: rand(2) === 0 ? 'upvote' : 'downvote',
    payload: {
      id: `Item${rand(ITEMS_COUNT)}`,
      userId: `User${rand(ITEMS_COUNT)}`
    }
  })
}

const cronHandlers = {
  '@reboot': async ({ resolve }) => {
    appendRating(resolve.executeCommand).catch(error => {
      // eslint-disable-next-line no-console
      console.log('Saga error:', error)
    })
  },
  '* * * * * *': async ({ resolve }) => {
    processRating(resolve.executeCommand).catch(error => {
      // eslint-disable-next-line no-console
      console.log('Saga error:', error)
    })
  }
}

export default cronHandlers
