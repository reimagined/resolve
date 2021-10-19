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

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(() => resolve(undefined), time))

const fetchSingle = (url: string) =>
  firebaseIP
    .then((ip) =>
      fetch(`https://${ip}/v0/${url}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Host: 'hacker-news.firebaseio.com',
        },
      })
    )
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text)
        })
      }
      return response.json()
    })

const fetchWithRetry = (url: string) => {
  return Promise.race([
    new Promise(async (resolve, reject) => {
      let error
      for (let retry = 0; retry <= 5; retry++) {
        try {
          const result = await fetchSingle(url)
          resolve(result)
        } catch (err) {
          error = err
        }
      }
      reject(error)
    }),
    wait(timeout),
  ])
}

const invokeImportApi = async (body: any) => {
  let loop = true
  return Promise.race([
    new Promise(async (resolve, reject) => {
      let error

      while (loop) {
        try {
          const response = await fetch(
            `${process.env.RESOLVE_APP_URL}/api/import-events`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(body),
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
    }),
  ])
}

const invokeImportSecretApi = async (body: any) => {
  let loop = true
  return Promise.race([
    new Promise(async (resolve, reject) => {
      let error

      while (loop) {
        try {
          const response = await fetch(
            `${process.env.RESOLVE_APP_URL}/api/import-secrets`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify(body),
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
    }),
  ])
}

const fetchStoryIds = (path: string) => fetchWithRetry(`${path}.json`)

const fetchItem = (id: string) => fetchWithRetry(`item/${id}.json`)

const fetchItems = (ids: string[]) => {
  return Promise.all(ids.map(fetchItem))
}

const api = {
  fetchStoryIds,
  fetchItems,
  invokeImportApi,
  invokeImportSecretApi,
}

export default api
