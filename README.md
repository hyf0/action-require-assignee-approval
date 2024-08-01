# Usage

```yml
name: CI

on:
  pull_request:
    types: [opened, assigned, unassigned, submitted]
    branches:
      - main
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  test-action:
    name: GitHub Actions Test
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Test Local Action
        id: test-action
        uses: ./
        with:
          milliseconds: 1000
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Print Output
        id: output
        run: echo "${{ steps.test-action.outputs.time }}"
```
