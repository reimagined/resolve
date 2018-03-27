import fetch from 'isomorphic-fetch'
import dns from 'dns'

const timeout = 15000

const firebaseIP = new Promise((resolve, reject) => {
  dns.resolve4('hacker-news.firebaseio.com', (err, addresses) => {
    if (err) {
      return reject(err)
    }
    resolve(addresses[0])
  })
})

const wait = (time, result) =>
  new Promise(resolve => setTimeout(() => resolve(result), time))

const fetchSingle = url =>
  firebaseIP
    .then(ip =>
      fetch(`https://${ip}/v0/${url}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Host: 'hacker-news.firebaseio.com'
        }
      })
    )
    .then(response => {
      if (!response.ok) {
        throw new Error(response.text())
      }
      return response.json()
    })

const fetchWithRetry = url => {
  return Promise.race([
    new Promise(async (resolve, reject) => {
      let error
      for (let retry = 0; retry <= 5; retry++) {
        try {
          resolve(await fetchSingle(url))
        } catch (err) {
          error = err
        }
      }
      reject(error)
    }),
    wait(timeout)
  ])
}

const fetchStoryIds = path => fetchWithRetry(`${path}.json`)

const fetchItem = id => fetchWithRetry(`item/${id}.json`)

const fetchItems = ids => {
  return Promise.all(ids.map(fetchItem))
}

export default {
  fetchStoryIds,
  fetchItems
}
