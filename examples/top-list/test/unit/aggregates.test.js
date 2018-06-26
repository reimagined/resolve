import commands from '../../common/aggregates/rating.commands'

describe('aggregates', () => {
  describe('Rating', () => {
    it('command "append" should create an event to append rating', () => {
      const state = undefined
      const command = { payload: { id: 'id1', name: 'name1' } }

      expect(commands.append(state, command)).toEqual({
        type: 'ItemAppended',
        payload: { id: command.payload.id, name: command.payload.name }
      })
    })

    it('command "upvote" should create an event to upvote rating', () => {
      const state = undefined
      const command = { payload: { id: 'id1', userId: 'userId1' } }

      expect(commands.upvote(state, command)).toEqual({
        type: 'RatingIncreased',
        payload: { id: command.payload.id, userId: command.payload.userId }
      })
    })

    it('command "downvote" should create an event to downvote rating', () => {
      const state = undefined
      const command = { payload: { id: 'id1', userId: 'userId1' } }

      expect(commands.downvote(state, command)).toEqual({
        type: 'RatingDecreased',
        payload: { id: command.payload.id, userId: command.payload.userId }
      })
    })
  })
})
