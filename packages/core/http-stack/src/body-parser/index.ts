import type { Parser, Predicate } from './parser-factory'
import * as json from './json'
import * as urlencoded from './urlencoded'
import * as multipart from './multipart'
import parserFactory from './parser-factory'

const parsers = {
  json: parserFactory(json),
  urlencoded: parserFactory(urlencoded),
  multipart: parserFactory(multipart),
}

const listOfParsers: Array<{
  parser: Parser
  predicate: Predicate
}> = [json, urlencoded, multipart]

const smartParser = parserFactory(
  {
    predicate: null,
    parser: async (body, contentType, parsedContentType) => {
      let result: any = undefined
      for (const { parser, predicate } of listOfParsers) {
        if (predicate != null && predicate(parsedContentType)) {
          result = await parser(body, contentType, parsedContentType)
          if (result !== undefined) {
            return result
          }
        }
      }
      return {}
    },
  },
  {}
)

const bodyParser = Object.assign(smartParser, parsers)

export default bodyParser
