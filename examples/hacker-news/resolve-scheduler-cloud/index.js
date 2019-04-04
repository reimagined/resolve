const createAdapter = ({ execute, errorHandler = async () => {} }) => {
  return {
    async addEntries(entries) {
      console.log(`adding entries ${entries}`)
    },
    async clearEntries() {
      console.log(`clearing entries`)
    }
  }
}

export default createAdapter
