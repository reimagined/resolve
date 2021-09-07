const emptyWorker = async () => {
  throw new Error(
    'Guard exception: worker should not be invoked in non-cloud environment'
  )
}

export default emptyWorker
