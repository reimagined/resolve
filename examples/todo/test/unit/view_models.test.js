import viewModels from '../../common/view-models'

const [todosViewModel] = viewModels

describe('view-models', () => {
  describe('Todos', () => {
    it('projection "ITEM_CREATED" should create a item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id2', text: 'text2' } }

      expect(todosViewModel.projection['ITEM_CREATED'](state, event)).toEqual({
        id1: {
          text: 'text1',
          checked: false
        },
        id2: {
          text: 'text2',
          checked: false
        }
      })
    })

    it('projection "ITEM_TOGGLED" should toggle the item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id1' } }

      expect(todosViewModel.projection['ITEM_TOGGLED'](state, event)).toEqual({
        id1: {
          text: 'text1',
          checked: true
        }
      })
    })

    it('projection "ITEM_REMOVED" should remove the item', () => {
      const state = {
        id1: {
          text: 'text1',
          checked: false
        }
      }
      const event = { payload: { id: 'id1' } }

      expect(todosViewModel.projection['ITEM_REMOVED'](state, event)).toEqual(
        {}
      )
    })
  })
})
