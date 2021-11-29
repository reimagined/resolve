import { mock } from 'jest-mock-extended'
import { Domain } from '@resolve-js/core'

export const initDomain = jest.fn(() => mock<Domain>())
