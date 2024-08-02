# github-action-require-assignee-approval

This action checks if the pull request's all assignees have approved the pull
request.

- If all assignees have approved the pull request, the action will pass.
- If any assignee has not approved the pull request, the action will fail.
- If the pull request has no assignee, the action will pass.
  - You could disable this behavior by setting `allow-no-assign` to `false`.
- You could bypass the action by setting `bypass-by` with a list of users. If
  any one in the bypass list has approved the pull request, the action will
  pass.
- If the action isn't triggered by a pull request, the action will pass.

# Usage

Time to show you care about some PRs and make sure it's won't be merged
accidentally without your approval.

```yml
name: Mergeability Check

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
  require-assignee-approval:
    name: Check assignees' approval
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Check assignees' approval
        uses: hyf0/action-require-assignee-approval@v1
        with:
          allow-no-assign: true # optional, default is `true`
          bypass-by: 'github-actions[bot]', 'dependabot[bot]' # optional, default is empty
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
