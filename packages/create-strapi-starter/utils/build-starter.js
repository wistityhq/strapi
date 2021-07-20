'use strict';

const { resolve, join, basename } = require('path');
const os = require('os');
const fse = require('fs-extra');

const ora = require('ora');
const ciEnv = require('ci-info');
const chalk = require('chalk');

const generateNewApp = require('strapi-generate-new');

const hasYarn = require('./has-yarn');
const { runInstall, runApp, initGit } = require('./child-process');
const { getRepoInfo, downloadGitHubRepo } = require('./fetch-github');
const logger = require('./logger');
const stopProcess = require('./stop-process');

/**
 * @param  {string} - filePath Path to starter.json file
 */
function readStarterJson(filePath, starterUrl) {
  try {
    const data = fse.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    stopProcess(`Could not find ${chalk.yellow('starter.json')} in ${chalk.yellow(starterUrl)}`);
  }
}

/**
 * @param  {string} rootPath - Path to the project directory
 * @param  {string} projectName - Name of the project
 */
async function initPackageJson(rootPath, projectName) {
  const packageManager = hasYarn() ? 'yarn --cwd' : 'npm run --prefix';

  try {
    await fse.writeJson(
      join(rootPath, 'package.json'),
      {
        name: projectName,
        private: true,
        workspaces: ['backend', 'frontend'],
        version: '0.0.0',
        scripts: {
          'develop:backend': `${packageManager} backend develop`,
          'predevelop:frontend': 'wait-on http://localhost:1337/admin',
          'develop:frontend': ` ${packageManager} frontend develop`,
          develop: 'cross-env FORCE_COLOR=1 npm-run-all -l -p develop:*',
        },
        devDependencies: {
          'npm-run-all': '4.1.5',
          'wait-on': '5.3.0',
          'cross-env': '7.0.3',
        },
      },
      {
        spaces: 2,
      }
    );
  } catch (err) {
    stopProcess(`Failed to create ${chalk.yellow(`package.json`)} in ${chalk.yellow(rootPath)}`);
  }
}

/**
 * @param  {string} path - The directory path for install
 */
async function installWithLogs(path) {
  const installPrefix = chalk.yellow('Installing dependencies:');
  const loader = ora(installPrefix).start();
  const logInstall = (chunk = '') => {
    loader.text = `${installPrefix} ${chunk
      .toString()
      .split('\n')
      .join(' ')}`;
  };

  const runner = runInstall(path);
  runner.stdout.on('data', logInstall);
  runner.stderr.on('data', logInstall);

  await runner;

  loader.stop();
  console.log(`Dependencies installed ${chalk.green('successfully')}.`);
}

/**
 * @param  {Object} projectArgs - The arguments for create a project
 * @param {string|null} projectArgs.projectName - The name/path of project
 * @param {string|null} projectArgs.starterUrl - The GitHub repo of the starter
 * @param  {Object} program - Commands for generating new application
 */
module.exports = async function buildStarter(programArgs, program) {
  let { projectName, starterUrl } = programArgs;

  // Fetch repo info
  const repoInfo = await getRepoInfo(starterUrl);
  const { fullName } = repoInfo;

  // Create temporary directory for starter
  const tmpDir = await fse.mkdtemp(join(os.tmpdir(), 'strapi-'));

  // Download repo inside temporary directory
  await downloadGitHubRepo(repoInfo, tmpDir);

  const starterJson = readStarterJson(join(tmpDir, 'starter.json'), starterUrl);

  // Project directory
  const rootPath = resolve(projectName);
  const projectBasename = basename(rootPath);

  try {
    await fse.ensureDir(rootPath);
  } catch (error) {
    stopProcess(`Failed to create ${chalk.yellow(rootPath)}: ${error.message}`);
  }

  // Copy the downloaded frontend folder to the project folder
  const frontendPath = join(rootPath, 'frontend');

  const starterDir = (await fse.pathExists(join(tmpDir, 'starter'))) ? 'starter' : 'frontend';

  try {
    await fse.copy(join(tmpDir, starterDir), frontendPath, {
      overwrite: true,
      recursive: true,
    });
  } catch (error) {
    stopProcess(`Failed to create ${chalk.yellow(frontendPath)}: ${error.message}`);
  }

  // Delete temporary directory
  await fse.remove(tmpDir);

  const fullUrl = `https://github.com/${fullName}`;
  // Set command options for Strapi app
  const generateStrapiAppOptions = {
    ...program,
    starter: fullUrl,
    template: starterJson.template,
    run: false,
  };

  // Create strapi app using the template
  await generateNewApp(join(rootPath, 'backend'), generateStrapiAppOptions);

  // Install frontend dependencies
  console.log(`Creating Strapi starter frontend at ${chalk.green(frontendPath)}.`);
  console.log(`Installing ${chalk.yellow(fullName)} starter`);
  await installWithLogs(frontendPath);

  // Setup monorepo
  initPackageJson(rootPath, projectBasename);

  // Add gitignore
  try {
    const gitignore = join(__dirname, '..', 'resources', 'gitignore');
    await fse.copy(gitignore, join(rootPath, '.gitignore'));
  } catch (err) {
    logger.warn(`Failed to create file: ${chalk.yellow('.gitignore')}`);
  }

  await installWithLogs(rootPath);

  if (!ciEnv.isCI) {
    await initGit(rootPath);
  }

  console.log(chalk.green('Starting the app'));
  await runApp(rootPath);
};
