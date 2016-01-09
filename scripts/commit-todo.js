'use strict';

// FIXME: not finished..

const diffParser = require('diff-parse');

const squareSymbol = '☐';

// TODO:? 'checked off # task(s)' ? match for check symbol

// sample changes data (for format)
let changes = [
  { originalLine: '', newLine: '\t' + squareSymbol + ' a new task!' }, // add
  { originalLine: '\t' + squareSymbol + 'dsd', newLine: '\t' + squareSymbol + ' a new task!' }, // modify
  { originalLine: '\t' + squareSymbol + 'dsd', newLine: '' },  // remove
];


function short() {
  // numbers of tasks added, modified, and removed
  let numAdded = 0, numModified = 0, numRemoved = 0,
    firstLetterOfOriginalLine, firstLetterOfNewLine,
    change;
  for (let i = 0; i < changes.length; i++) {
    // get `oldLine` and `newLine` somehow
    change = changes[i];

    firstLetterOfOriginalLine = change.originalLine.trim()[0];
    firstLetterOfNewLine = change.newLine.trim()[0];

    if (firstLetterOfOriginalLine === squareSymbol) {
      if (firstLetterOfNewLine === squareSymbol) {
        numModified++;
      } else {
        numRemoved++;
      }
    } else if (firstLetterOfNewLine === squareSymbol) {
      numAdded++;
    }
  }

  const wordTasks = (num) => num > 1 ? 'tasks' : 'task';

  const shortParts = [];
  if (numAdded) shortParts[shortParts.length] = `added ${numAdded} new ${wordTasks(numAdded)}`;
  if (numModified) shortParts[shortParts.length] = `edited ${numModified} ${wordTasks(numModified)}`;
  if (numRemoved) shortParts[shortParts.length] = `removed ${numRemoved} ${wordTasks(numRemoved)}`;

  return shortParts.join('; ');
}

// TODO. see manual commits for format
function long() {
  return '';
}

module.exports = function generateCommitMessage(diff) {
    console.log(diff);
    changes = diffParser(diff); // FIXME! not right format
    return short() + '\n\n' + long();
};
