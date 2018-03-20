import viewModels from '../../common/view-models'

const [likesViewModel] = viewModels

describe('view-models', () => {
  describe('Likes', () => {
    it('projection "LIKE" should create a item', () => {
      const state = ['Alice']
      const event = { payload: { username: 'Bob' } }

      expect(likesViewModel.projection['LIKE'](state, event)).toEqual([
        'Alice',
        'Bob'
      ])
    })

    it('projection "LIKE" should remove the item', () => {
      const state = ['Alice']
      const event = { payload: { username: 'Alice' } }

      expect(likesViewModel.projection['LIKE'](state, event)).toEqual([])
    })
  })
})
