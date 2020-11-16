const commitTransaction = async ({ runQuery }) => {
  await runQuery(`COMMIT;`, true)
}

export default commitTransaction
