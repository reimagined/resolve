import type { ContentType } from '../types'
import type { ParserFactory } from './parser-factory'
import parserFactory from './parser-factory'

const combineParsers = <
  Parsers extends Record<
    string,
    {
      predicate: (contentType: ContentType) => boolean
      parser: (
        body: Buffer,
        contentType: string,
        parsedContentType: ContentType
      ) => Promise<any>
    }
  >
>(
  parsers: Parsers
): ParserFactory<any> &
  {
    [Property in keyof Parsers]: ParserFactory<
      Awaited<ReturnType<Parsers[Property]['parser']>>
    >
  } => {
  const combinedParser = Object.fromEntries(
    Object.entries(parsers).map(([key, value]) => [key, parserFactory(value)])
  )

  const smartParser = parserFactory({
    predicate: null,
    parser: async (body, contentType, parsedContentType) => {
      let result: any = undefined
      for (const { parser, predicate } of Object.values(parsers)) {
        if (predicate(parsedContentType))
          result = await parser(body, contentType, parsedContentType)
        if (result !== undefined) {
          return result
        }
      }
      return {}
    },
  })
  Object.assign(smartParser, combinedParser)

  return smartParser as any
}

export default combineParsers
