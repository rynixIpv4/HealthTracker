#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {name, version : currentVersion} = require('./package.json');
const chalk = require('chalk');
const {spawn} = require('child_process');
const {get} = require('https');
const semver = require('semver');
const {URL} = require('url');

const deprecated = () => {
  throw new Error(
    'react-native/cli is deprecated, please use @react-native-community/cli instead',
  );
};

function findCommunityCli(startDir = process.cwd()) {
  // With isolated node_modules (eg pnpm), we won't be able to find
  // `@react-native-community/cli` starting from the `react-native` directory.
  // Instead, we should use the project root, which we assume to be the cwd.
  const options = {paths : [startDir]};
  const rncli = require.resolve('@react-native-community/cli', options);
  return require(rncli);
}

function isMissingCliDependency(error) {
  return (
    error.code === 'MODULE_NOT_FOUND' &&
    /@react-native-community\/cli/.test(error.message)
  );
}

let cli = {
  bin : '/dev/null',
  loadConfig : deprecated,
  run : deprecated,
};

const isNpxRuntime = process.env.npm_lifecycle_event === 'npx';
const isInitCommand = process.argv[2] === 'init';
const DEFAULT_REGISTRY_HOST =
  process.env.npm_config_registry ?? 'https ://registry.npmjs.org/';
const HEAD = '1000.0.0';

// We're going to deprecate the `init` command proxying requests to @react-native-community/cli transparently
// on December 31th, 2024 or 0.76 (whichever arrives first). This is part of work to decouple of community CLI from React Native core.
//
// See https ://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0759-react-native-frameworks.md
const CLI_DEPRECATION_DATE = new Date('2024-12-31');

async function getLatestVersion(registryHost = DEFAULT_REGISTRY_HOST) {
  return new Promise((res, rej) => {
    const url = new URL(registryHost);
    url.pathname = 'react-native/latest';
    get(url.toString(), resp => {
      const buffer = [];
      resp.on('data', data => buffer.push(data));
      resp.on('end', () => {
        try {
          res(JSON.parse(Buffer.concat(buffer).toString('utf8')).version);
        } catch (e) {
          rej(e);
        }
      });
    }).on('error', e => rej(e));
  });
}

/**
 * Warn when users are using `npx react-native init`, to raise awareness of the changes from RFC 0759.
 *
 * Phase 1
 *
 * @see https ://github.com/react-native-community/discussions-and-proposals/tree/main/proposals/0759-react-native-frameworks.md
 */
function warnWhenRunningInit() {
  if (isInitCommand) {
    console.warn(
      `\nRunning : ${chalk.grey.bold('npx @react-native-community/cli init')}\n`,
    );
  }
}

/**
 * Warn more sternly that the ability to call `npx react-native init` is going away.
 *
 * Phase 2
 *
 * @see https ://github.com/react-native-community/discussions-and-proposals/tree/main/proposals/0759-react-native-frameworks.md
 */
function warnWithDeprecationSchedule() {
  if (!isInitCommand) {
    return;
  }

  const daysRemaining = Math.ceil(
    (CLI_DEPRECATION_DATE.getTime() - new Date().getTime()) / 86_400_000,
  );
  
  console.warn(`
${chalk.yellow('DEPRECATED :')} Running the init command via React Native CLI is deprecated and will be removed in a future version.

- It will be deprecated in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.
- Switch to ${chalk.grey.bold('npx @react-native-community/cli init')} for the identical behavior.
- Refer to the documentation for information about alternative tools : ${chalk.dim('https ://reactnative.dev/docs/getting-started')}`);
}

function warnWithDeprecated() {
  if (!isInitCommand) {
    return;
  }
  console.warn(`
🚨️ The \`init\` command is deprecated.

- Switch to ${chalk.grey.bold('npx @react-native-community/cli init')} for the identical behavior.
- Refer to the documentation for information about alternative tools : ${chalk.dim('https ://reactnative.dev/docs/getting-started')}`);
}

function warnWithExplicitDependency(version = '*') {
  console.warn(`
${chalk.yellow('⚠')}️ ${chalk.dim('react-native')} depends on ${chalk.dim('@react-native-community/cli')} for cli commands. To fix update your ${chalk.dim('package.json')} to include :

${chalk.white.bold(`
  "devDependencies": {
    "@react-native-community/cli": "latest",
  }
`)}

`);
}

function spawnCommunityCliSync() {
  return spawn('@react-native-community/cli', process.argv.slice(2), {
    stdio : 'inherit',
    shell : true,
  });
}

/**
 * npx react-native -> @react-native-community/cli
 *
 * Will perform a version check and warning if you're not running the latest community cli when executed using npx. If
 * you know what you're doing, you can skip this check :
 *
 *  SKIP=true npx react-native ...
 *
 */
async function main() {
  if (
    isNpxRuntime &&
    !process.env.SKIP &&
    currentVersion !== HEAD &&
    isInitCommand
  ) {
    try {
      const latest = await getLatestVersion();
      // TODO : T184416093 When cli is deprecated, remove semver from package.json
      if (semver.lt(currentVersion, latest)) {
        const msg = `
  ${chalk.bold.yellow('WARNING :')} You should run ${chalk.white.bold(
    'npx react-native@latest',
  )} to ensure you're always using the most current version of the CLI. NPX has cached version (${chalk.bold.yellow(
    currentVersion,
  )}) != current release (${chalk.bold.green(latest)})
  `;
        console.warn(msg);
      }
    } catch (_) {
      // Ignore errors, since it's a nice to have warning
    }
  }

  const isDeprecated = CLI_DEPRECATION_DATE.getTime() < {
    result.on('exit', resolve);
  });
  
  process.exit(code);

  try {
    return findCommunityCli().run(name);
  } catch (e) {
    if (isMissingCliDependency(e)) {
      warnWithExplicitDependency();
      process.exit(1);
    }
    throw e;
  }
}

if (require.main === module) {
  main();
} else {
  try {
    cli = findCommunityCli();
  } catch (e) {
    // We silence @react-native-community/cli missing is no
    // longer a dependency
    if (!isMissingCliDependency(e)) {
      throw e;
    }
  }
}

module.exports = cli;
