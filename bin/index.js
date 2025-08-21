#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";

// Fetch GitHub activity
async function fetchGithubActivity(username) {
  const response = await fetch(
    `https://api.github.com/users/${username}/events`,
    {
      headers: {
        "User-Agent": "node.js",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found. Please check the username.");
    } else if (response.status === 403) {
      throw new Error("API rate limit exceeded. Try again later.");
    } else {
      throw new Error(`Error fetching data: ${response.status}`);
    }
  }

  return response.json();
}

// Capitalize utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Display GitHub activity
function displayActivity(events) {
  if (events.length === 0) {
    console.log(chalk.yellow("No recent activity found."));
    return;
  }

  console.log(chalk.bold.yellow("\nRecent GitHub Activity:\n"));

  events.forEach((event) => {
    let action;
    const repoName = chalk.cyan(event.repo.name);

    switch (event.type) {
      case "PushEvent":
        const commitCount = event.payload.commits.length;
        action = chalk.green(`Pushed ${commitCount} commit(s) to ${repoName}`);
        break;
      case "IssuesEvent":
        action = chalk.green(
          `${capitalize(event.payload.action)} an issue in ${repoName}`
        );
        break;
      case "WatchEvent":
        action = chalk.green(`Starred ${repoName}`);
        break;
      case "ForkEvent":
        action = chalk.green(`Forked ${repoName}`);
        break;
      case "CreateEvent":
        action = chalk.green(
          `Created ${event.payload.ref_type} in ${repoName}`
        );
        break;
      default:
        action = chalk.gray(
          `${event.type.replace("Event", "")} in ${repoName}`
        );
        break;
    }

    console.log(`- ${action}`);
  });
}

// Main CLI logic
program.action(() => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "username",
        message: chalk.blue("Enter GitHub username:"),
      },
    ])
    .then(async (answers) => {
      const username = answers.username;

      if (!username) {
        console.error(chalk.red("Please provide a GitHub username."));
        process.exit(1);
      }

      try {
        const events = await fetchGithubActivity(username);
        displayActivity(events);
      } catch (error) {
        console.error(chalk.red(`\nError: ${error.message}`));
        process.exit(1);
      }
    });
});

// Parse CLI arguments
program.parse(process.argv);