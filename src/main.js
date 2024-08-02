const github = require('@actions/github')
const core = require('@actions/core')
const R = require('remeda')

/**
 * Get the input value from the workflow file.
 * @param {string} name The name of the input.
 * @param {boolean} defaultValue The default value of the input.
 * @returns {boolean} The value of the input.
 */
function getBooleanInput(name, defaultValue) {
  const value = core.getInput(name)
  if (value === '') {
    return defaultValue
  }
  return value === 'true'
}

exports.run = async function run() {
  const githubToken = process.env.GITHUB_TOKEN

  const config = {
    allowNoAssign: getBooleanInput('allow-no-assign', true),
    bypassBy: R.pipe(
      core.getInput('bypass-by'),
      R.split(','),
      R.map(s => s.trim()),
      R.filter(s => s !== '')
    )
  }

  const context = github.context

  if (!githubToken) {
    core.setFailed("Can't get `GITHUB_TOKEN` from environment.")
    return
  }

  if (context.eventName !== 'pull_request' || !context.payload.pull_request) {
    core.info('Bailout: Not a pull request.')
    return
  }
  const octokit = github.getOctokit(githubToken)

  const pullNumber = context.payload.pull_request.number

  const { data: reviews } = await octokit.rest.pulls.listReviews({
    pull_number: pullNumber,
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
    pull_number: pullNumber
  })

  const assignees = R.pipe(
    pullRequest.assignees ?? [],
    R.map(assignee => assignee.login)
  )

  if (assignees.length === 0 && !config.allowNoAssign) {
    core.setFailed(
      'No assignees found on pull request. And `allowNoAssign` is false.'
    )
    return
  }

  core.info(`Assignees: [${assignees}]`)

  const bypassed = R.find(assignees, assignee =>
    config.bypassBy.includes(assignee)
  )

  if (bypassed) {
    core.info(`Bypassed by ${bypassed}.`)
    return
  }

  const assigneesNotApproved = assignees.filter(
    assignee => !approvers.has(assignee)
  )

  if (assigneesNotApproved.length > 0) {
    core.setFailed(`Require assignees ${assignees} to approved the PR.`)
    return
  }
}
