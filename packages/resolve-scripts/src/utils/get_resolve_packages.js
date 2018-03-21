import request from 'request'

const getResolvePackages = () =>
  new Promise((resolve, reject) =>
    request(
      'https://www.npmjs.com/-/search?text=maintainer:reimagined&size=100',
      { json: true },
      (fetchError, response, body) => {
        if (fetchError) {
          reject('Package list loading error:' + fetchError.stack)
        }
        try {
          resolve(body.objects.map(object => object.package.name))
        } catch (parseError) {
          reject('Package list loading error:' + parseError.stack)
        }
      }
    )
  )

export default getResolvePackages
