# CI/CD-Configuration

## Used Pipelines

- SonarCloud
- Travis-CI
- Coveralls
- Fossa
- Lint Action

### README.md

- Change all Badges to correct url

### SondarCloud

`for new project`

- Checks any Code-Smells and Code-Quality metrics
  - Activate account and connect with GitHub
    - https://sonarcloud.io/projects
  - Add the project
    - https://sonarcloud.io/projects/create
    - Add .github/workflows/build.yml to the repo
      - Check correct branch: master-->main
    - Add sonar-project.properties
    - Add `SONAR-TOKEN` to Git-Repo
  - Configure New Code after first analysis to "Previous version"
    - All code that has changed since the previous version bump is considered new code

### Fossa

`for new project`

- Check the if any license problems are found
- Add the Repo
  - https://app.fossa.com/projects

### NPM Publish CI/CD

- Add new Secret to Git-Repo: NPM_TOKEN
  - https://docs.npmjs.com/creating-and-viewing-access-tokens
- Add new Secret to Git-Repo: GH_PERSONAL_ACCESS_TOKEN
  - Select scopes: `repo`
  - https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token
- from Tutorial: https://aboutbits.it/blog/2021-03-11-using-github-actions-to-perfom-npm-version-increment

### Lint Action

- Automatically formats code to meet linting requirements
  - https://github.com/marketplace/actions/lint-action
- https://github.com/wearerequired/lint-action
  - Setup in .github/workflows/build.yml
  - activate: auto_fix
  - add .github to .eslintignore and .prettierignore
