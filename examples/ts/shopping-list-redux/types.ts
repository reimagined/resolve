export type ShoppingListViewModelState = {
  id: string
  name: string
  removed: boolean
  list: Array<{
    id: string
    text: string
    checked: boolean
  }>
}
