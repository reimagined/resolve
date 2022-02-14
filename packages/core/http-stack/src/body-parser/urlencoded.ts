import { parse as parseQuery } from 'query-string'

import type { ContentType, UrlencodedData } from '../types'

export const parser = async (body: Buffer): Promise<UrlencodedData> =>
  parseQuery(body.toString(), {
    arrayFormat: 'bracket',
  }) as UrlencodedData

export const predicate = ({
  type,
  subType,
  params: { charset },
}: ContentType): boolean =>
  type === 'application' &&
  subType === 'x-www-form-urlencoded' &&
  charset === 'utf-8'
