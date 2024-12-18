module.exports = {
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "ignoreRestSiblings": true
    }],
    // If you want to completely disable the rule:
    // "@typescript-eslint/no-unused-vars": "off",
  }
} 