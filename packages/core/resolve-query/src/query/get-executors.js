const getExecutors = ({
  checkQueryDisposeState,
  executors,
  disposePromise
}) => {
  checkQueryDisposeState(disposePromise)
  return executors
}

export default getExecutors
