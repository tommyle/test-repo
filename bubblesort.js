import { Probot } from "probot";
import { generateCommitMessage } from './openai';

const commands = ["/cf", "/commitflow"];

function containsCommand(comment: string): boolean {
  return commands.some((command) => comment.includes(command));
}

function getInstruction(comment: string): string {
  const command = commands.find((command) => comment.includes(command));
  if (!command) {
    return "";
  }
  return comment.slice(comment.indexOf(command) + command.length).trim();
}

export = (app: Probot) => {
  // Issues opened
  app.on("issues.opened", async (context) => {});

  // Pull request opened
  app.on("pull_request.opened", async (context) => {
    await createPullRequestSummary(context);
  });

  // Pull request review comment created
  app.on("pull_request_review_comment.created", async (context) => {
    await processCommand(context);
  });

  // Issue comment created
  app.on("issue_comment.created", async (context) => {});

  // Any event
  app.onAny(async (context) => {
    await anyEvent(context, app);
  });
};

async function createPullRequestSummary(context: any) {
  // Get the diff of the pull request
  const { data: diff } = await context.octokit.pulls.get({
    owner: context.repo().owner,
    repo: context.repo().repo,
    pull_number: context.payload.pull_request.number,
    headers: {
      accept: "application/vnd.github.diff",
    },
  });
  
  const command = commands.find((command) => comment.includes(command));
  if (!command) {
    return "";
  }

  const commitMessage = await generateCommitMessage(`${diff}`);

  const diffFormatted = `\`\`\`${diff}\`\`\``;

  // Create a comment on the pull request with the diff
  const diffComment = context.issue({
    body: `Diff:\n${diffFormatted}\nSummary:\n${commitMessage}`,
  });

  await context.octokit.issues.createComment(diffComment);
}

async function processCommand(context: any) {
  const comment = context.payload.comment.body;

  if (containsCommand(comment)) {
    const instruction = getInstruction(comment);

    await context.octokit.issues.createComment({
      ...context.issue(),
      body: instruction
    });
  }
}

async function anyEvent(context: any, app: Probot) {
  const { name, payload } = context;
  const action = "action" in payload ? payload.action : 'unknown';
  app.log.info({ event: name, action: action });
  
  const command = commands.find((command) => comment.includes(command));
  if (!command) {
    return "";
  }
}

export = (app: Probot) => {
  app.onAny(async (context) => {
    await anyEvent(context, app);
  });
  
  // app.on("issues.opened", async (context) => {
  // });
  app.on("pull_request.opened", async (context) => {
    await createPullRequestSummary(context);
  });
  app.on("pull_request_review_comment.created", async (context) => {
    await processCommand(context);
  });
  // app.on("issue_comment.created", async (context) => {
  // });
  app.onAny(async (context) => {
    await anyEvent(context, app);
  });
};
