const commitTransaction = async ({ runRawQuery }) => {
  await runRawQuery(`COMMIT;`)
}

export default commitTransaction
