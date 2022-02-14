import type { ContentType } from '../types'

export const parser = async (body: Buffer): Promise<any> => {
  try {
    return JSON.parse(body.toString())
  } catch {
    return undefined
  }
}

export const predicate = ({
  type,
  subType,
  params: { charset },
}: ContentType): boolean =>
  type === 'application' && subType === 'json' && charset === 'utf-8'
