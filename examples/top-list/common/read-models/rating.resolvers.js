export default {
  TopRating: async (store, args) => {
    const pageNumber = Math.max(
      Number.isInteger(args && +args.page) ? +args.page : 0,
      0
    )
    const pageLength = Math.max(
      Number.isInteger(args && +args.limit) ? +args.limit : 10,
      0
    )
    const skipItems = pageNumber * pageLength
    
    return await store.find(
      'Rating',
      {},
      { id: 1, rating: 1, name: 1 },
      { rating: -1 },
      skipItems,
      pageLength
    )
  },
  
  PagesCount: async (store, args) => {
    const pageLength = Math.max(
      Number.isInteger(args && +args.limit) ? +args.limit : 10,
      0
    )
    const count = await store.count('Rating', {})
    
    return count > 0 ? Math.floor((count - 1) / pageLength) + 1 : 0
  }
}