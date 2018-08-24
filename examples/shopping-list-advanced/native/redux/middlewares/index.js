import optimisticShoppingListsMiddleware from './optimisticShoppingListsMiddleware'
import optimisticSharingsMiddleware from './optimisticSharingsMiddleware'

export default [optimisticShoppingListsMiddleware, optimisticSharingsMiddleware, (store)=>next=>action=>{
  console.log(action)
  next(action)
}]
