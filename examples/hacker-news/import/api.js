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

const invokeImportApi = async body => {
  let loop = true
  return Promise.race([
    new Promise(async (resolve, reject) => {
      let error

      while (loop) {
        try {
          const response = await fetch(
            `http://localhost:${process.env.PORT}${process.env.ROOT_PATH}/api/import_events`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(body)
            }
          )
          resolve(await response.text())
          loop = false
          break
        } catch (err) {
          error = err
          await wait(100)
        }
      }

      reject(error)
    }),
    wait(timeout).then(() => {
      loop = false
    })
  ])
}

const fetchStoryIds = path => fetchWithRetry(`${path}.json`)

const fetchItem = id => fetchWithRetry(`item/${id}.json`)

const fetchItems = ids => {
  return Promise.all(ids.map(fetchItem))
}

export default {
  fetchStoryIds,
  fetchItems,
  invokeImportApi
}
