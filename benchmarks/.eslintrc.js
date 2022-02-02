module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:import/typescript'],
      rules: {
        'no-console': ['off'],
      },
    },
  ],
}
