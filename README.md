<h1><a href="https://www.npmjs.com/package/consys"><img src="https://user-images.githubusercontent.com/37511270/127232757-a7fcfdbf-44d1-429a-8531-41a3d0d9e40d.png" width="50" heigth="50" /></a><a href="https://www.npmjs.com/package/consys">consys</a> - flexible model-constraint checking</h1>

<p align="left">
  <a href="https://badge.fury.io/js/consys.svg"><img src="https://badge.fury.io/js/consys.svg" alt="npm package" /></a>
  <a href="https://img.shields.io/github/license/FireboltCasters/consys"><img src="https://img.shields.io/github/license/FireboltCasters/consys" alt="MIT" /></a>
  <a href="https://img.shields.io/github/last-commit/FireboltCasters/consys?logo=git"><img src="https://img.shields.io/github/last-commit/FireboltCasters/consys?logo=git" alt="last commit" /></a>
  <a href="https://www.npmjs.com/package/consys"><img src="https://img.shields.io/npm/dm/consys.svg" alt="downloads week" /></a>
  <a href="https://www.npmjs.com/package/consys"><img src="https://img.shields.io/npm/dt/consys.svg" alt="downloads total" /></a>
  <a href="https://github.com/FireboltCasters/consys"><img src="https://shields.io/github/languages/code-size/FireboltCasters/consys" alt="size" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2FFireboltCasters%2Fconsys?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FFireboltCasters%2Fconsys.svg?type=shield"/></a>
  <a href="https://github.com/google/gts" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/code%20style-google-blueviolet.svg"/></a>
  <a href="https://shields.io/" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/uses-TypeScript-blue.svg"/></a>
  <a href="https://github.com/marketplace/actions/lint-action"><img src="https://img.shields.io/badge/uses-Lint%20Action-blue.svg"/></a>
</p>

<p align="left">
  <a href="https://github.com/FireboltCasters/consys/actions/workflows/npmPublish.yml"><img src="https://github.com/FireboltCasters/consys/actions/workflows/npmPublish.yml/badge.svg" alt="Npm publish" /></a>
  <a href="https://github.com/FireboltCasters/consys/actions/workflows/linter.yml"><img src="https://github.com/FireboltCasters/consys/actions/workflows/linter.yml/badge.svg" alt="Build status" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=alert_status" alt="Quality Gate" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=bugs" alt="Bugs" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=coverage" alt="Coverage" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=code_smells" alt="Code Smells" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=duplicated_lines_density" alt="Duplicated Lines (%)" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=sqale_rating" alt="Maintainability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=reliability_rating" alt="Reliability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=security_rating" alt="Security Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=sqale_index" alt="Technical Debt" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys&metric=vulnerabilities" alt="Vulnerabilities" /></a>
</p>

**consys** is a flexible tool to evaluate models using generic and readable constraints.

- **Modern & Lightweight:** consys has full TypeScript support and uses no additional dependencies, so it can easily be integrated.
- **Customizable:** Register custom functions and plugins, tailored to the application.
- **Flexible:** Constraints are designed to be as flexible as possible, while still being readable.
- **User friendly:** consys defines its own domain specific language to manage constraints, making it easy to read and fully generic.

## Installation

**consys** is distributed via [npm](https://www.npmjs.com/package/consys), it can be installed using the following command:

```console
npm install consys
```

## Quick start

After the installation, you can start using it. Here is a small example to get you started:

```typescript
// First import the package
import {ConstraintSystem} from 'consys';

// This is our simple model, with an id and age entry
type TableRow = {
  id: number;
  entryAge: number;
};

// Now, lets create our constraint system
const rowConstraints = new ConstraintSystem<TableRow, {}>();

// For our constraint, we choose a simple assertion that must always be true:
rowConstraints.addConstraint({
  constraint: 'ALWAYS: $entryAge < 21',
  message: 'Row (id: $id): Age is $entryAge, but it must be 20 or lower.',
});

// Before we can evaluate something, we need to create some instances of our model
let rows: TableRow[] = [
  {id: 0, entryAge: 42},
  {id: 1, entryAge: 16},
  {id: 2, entryAge: 1337},
];

// Lets evaluate our model instance
let reports = rowConstraints.evaluate(rows, {});

for (let report of reports) {
  // Since we have only one constraint, there is only one evaluation
  let evaluation = report.evaluation[0];

  // Now print all errors
  if (!evaluation.consistent) {
    console.log(evaluation.message);
  }
}
```

Output:

```console
>> Row (id: 0): Age is 42, but it must be 20 or lower.
>> Row (id: 2): Age is 1337, but it must be 20 or lower.
```

## Documentation

For a more detailed look into all of the features, including the constraint syntax, custom functions, plugins and more, please have a look into the [wiki](https://github.com/FireboltCasters/consys/wiki).

## Related packages

You might also want to take a look at [consys-solver](https://github.com/FireboltCasters/consys-solver), which is a tool built upon consys that can find feasible models for constraint systems.

## Contributors

The FireboltCasters

<a href="https://github.com/FireboltCasters/consys"><img src="https://contrib.rocks/image?repo=FireboltCasters/consys" alt="Contributors" /></a>
