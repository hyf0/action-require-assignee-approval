const github = require('@actions/github')
const core = require('@actions/core')
const R = require('remeda')

exports.run = async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const githubToken = process.env.GITHUB_TOKEN

  const allowNoAssign = true
  const context = github.context

  if (!githubToken) {
    core.setFailed("Can't get `GITHUB_TOKEN` from environment.")
    return
  }

  if (context.eventName !== 'pull_request' || !context.payload.pull_request) {
    core.info('Bailout: Not a pull request.')
    return
    // Assignee is only meaningful on PRs
  }
  const octokit = github.getOctokit(githubToken)

  const pull_number = context.payload.pull_request.number

  const { data: reviews } = await octokit.rest.pulls.listReviews({
    pull_number,
    owner: context.repo.owner,
    repo: context.repo.repo
  })

  const approvers = new Set(
    R.pipe(
      reviews,
      R.filter(review => review.state === 'APPROVED'),
      R.map(review => review.user?.login ?? null),
      R.filter(R.isNonNull)
    )
  )

  core.info(`Approvers: ${Array.from(approvers).join(', ')}`)

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number
  })

  core.info(`Pull request: ${JSON.stringify(pullRequest.assignee, null, 2)}`)
  core.info(`Pull request: ${JSON.stringify(pullRequest.assignees, null, 2)}`)

  const assignees = pullRequest.assignees ?? []

  if (assignees.length === 0 && !allowNoAssign) {
    core.setFailed(
      'No assignees found on pull request. And `allowNoAssign` is false.'
    )
    return
  }

  core.info(`Assignees: [${assignees}]`)

  const assigneesNotApproved = assignees.filter(assignee =>
    approvers.has(assignee.login)
  )

  if (assigneesNotApproved.length > 0) {
    core.setFailed(
      `Require assignees ${assigneesNotApproved.map(assignee => assignee.login).join(', ')} to approved the PR.`
    )
    return
  }
}
