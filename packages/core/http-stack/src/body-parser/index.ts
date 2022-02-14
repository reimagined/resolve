import * as json from './json'
import * as urlencoded from './urlencoded'
import * as multipart from './multipart'
import combineParsers from './combine-parsers'

const parsers = {
  json,
  urlencoded,
  multipart,
}

const parseBody = combineParsers(parsers)

export default parseBody
