# github-action-require-assignee-approval

This action checks if the pull request's all assignees have approved the pull
request.

- If all assignees have approved the pull request, the action will pass.
- If any assignee has not approved the pull request, the action will fail.
- If the pull request has no assignee, the action will pass.
  - You could disable this behavior by setting `allow-no-assign` to `false`.
- If the action isn't triggered by a pull request, the action will pass.

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

      - name: Require assignee approval
        uses: hyf0/action-require-assignee-approval@v1
        with:
          allow-no-assign: true # optional, default is `true`
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
