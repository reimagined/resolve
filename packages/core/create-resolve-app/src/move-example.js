const moveExample = (pool) => async () => {
  const {
    fs,
    path,
    applicationPath,
    resolveClonePath,
    resolveCloneExamplePath,
  } = pool;
  for (const resource of fs.readdirSync(resolveCloneExamplePath)) {
    fs.moveSync(
      path.join(resolveCloneExamplePath, resource),
      path.join(applicationPath, resource),
      { overwrite: true }
    );
  }

  fs.removeSync(resolveClonePath);
};

export default moveExample;
