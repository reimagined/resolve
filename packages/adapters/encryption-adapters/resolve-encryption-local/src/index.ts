import Cryptr from 'cryptr'

import {
  getKey,
  insertKey,
  forgetKey,
  generateKey,
  ExecutionResult
} from './api'

type Decryptor = (blob: string) => string

export const encrypt = async (
  keySelector: string,
  data: string
): Promise<string> => {
  let keyValue = await getKey(keySelector)
  if (!keyValue) {
    keyValue = generateKey()
    await insertKey(keySelector, keyValue)
  }
  const cryptr = new Cryptr(keyValue)
  const blob = await cryptr.encrypt(data)
  return blob
}

export const decrypt = async (
  keySelector: string
): Promise<Decryptor | null> => {
  const keyValue = await getKey(keySelector)
  if (keyValue) {
    const cryptr = new Cryptr(keyValue)
    return (blob: string): string => cryptr.decrypt(blob)
  }
  return null
}

export const forget = (keySelector: string): ExecutionResult =>
  forgetKey(keySelector)

/* export const test = async (count: number, data: string): Promise<void> => {
  for (let i = 0; i < count; i++) {
    const blob = await encryptAES256(generateKey(), data)
  }
} */
