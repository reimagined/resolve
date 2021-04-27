import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import loaderUtils from 'loader-utils'
import path from 'path'

const valQueryLoader = function (content) {
  const relPath = path.relative.bind(path, process.cwd())
  const valQueryOptions = loaderUtils.getOptions(this)
  const resourceQuery =
    this.resourceQuery != null && this.resourceQuery.constructor === String
      ? this.resourceQuery
      : ''
  const pureResource = this.resource.substring(
    0,
    this.resource.length - resourceQuery.length
  )

  const func = interopRequireDefault(this.exec(content, pureResource)).default

  if (typeof func !== 'function') {
    throw new Error(
      `Module ${relPath(this.resource)} does not export default function`
    )
  }

  const result = func(valQueryOptions, resourceQuery)
  if (result == null || result.constructor !== String) {
    this.callback(
      new Error(
        `The returned result of the ${relPath(
          this.resource
        )} module is not a string`
      )
    )
    return
  }

  this.cacheable(false)

  this.callback(null, result, null, null)
}

export default valQueryLoader
