const core = require('@actions/core');
const gh = require('@actions/github');

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.debug("START DEBUG")
    core.debug(core.getInput('token'))
    const octokit = gh.getOctokit(core.getInput('token'));
    const shortcutComments = [];
    for await (const {data: comments} of octokit.paginate.iterator(
      octokit.rest.issues.listComments,
      {
        ...gh.context.issue,
        issue_number: gh.context.issue.number,
        number: undefined
      }
    )) {
      shortcutComments.push(...comments.filter(comment =>
        comment.user.login === 'shortcut-integration[bot]'
      ))
    }

    if (shortcutComments.length > 1) return core.setFailed("More than one shortcut comment found!  Split your PR.")
    if (shortcutComments.length < 1) return core.setFailed("No shortcut ticket found!")

    const commentBody = shortcutComments[0].body;

    await octokit.rest.issues.update({
      ...gh.context.issue,
      issue_number: gh.context.issue.number,
      title: commentBody.slice(commentBody.indexOf(':')+2, commentBody.indexOf(']')),
      number: undefined
    })
  } catch (error) {
    core.debug(error)
    core.setFailed(error.message);
  }
}

run();
