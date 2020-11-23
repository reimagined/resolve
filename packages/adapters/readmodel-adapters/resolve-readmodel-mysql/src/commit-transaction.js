const commitTransaction = async ({ runQuery }) => {
  await runQuery(`COMMIT;`)
}

export default commitTransaction
