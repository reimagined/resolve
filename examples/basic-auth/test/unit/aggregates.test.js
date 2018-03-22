import dotenv from 'dotenv'
import jsonwebtoken from 'jsonwebtoken'

import aggregates from '../../common/aggregates'

dotenv.config()

const [animalAggregate] = aggregates

describe('aggregates', () => {
  describe('Animal', () => {
    it('command "like" should create an event to like the item', () => {
      const state = undefined
      const command = { payload: {} }
      const jwtToken = jsonwebtoken.sign(
        { username: 'Alice' },
        process.env.JWT_SECRET
      )

      expect(animalAggregate.commands.like(state, command, jwtToken)).toEqual({
        type: 'LIKE',
        payload: { username: 'Alice' }
      })
    })

    it('command "like" should throw error', () => {
      const state = undefined
      const command = { payload: {} }
      const jwtToken = jsonwebtoken.sign(
        { username: 'Alice' },
        'INCORRECT_SECRET'
      )

      expect(() =>
        animalAggregate.commands.like(state, command, jwtToken)
      ).toThrow()
    })
  })
})
