/* global $trackList */

const path = require('path');

import util from './util';

//

function fileHasAlreadyBeenAdded(fileHash) {
    return Array.includes($.map(this.files, file => file.fileHash === fileHash), true);
}
const fileHasAlreadyBeenAddedErrMsg = (filePath) => `${filePath}: File is already in the track list`;

//

export default class FileList {

    constructor({ trackListTable }) {
		this.trackListTable = trackListTable;
		this.files = {};
    }

    addFile(filePath, { $entry, trackLength, fileHash }) {
		this.files[filePath] = {
			entry: $entry,
			trackLength,
			fileHash,
			completed: false,
		};
    }

	// todo: turn into an async function
    displayFile(filePath) {
		const fileName = path.basename(filePath);

		let trackLength;

		return new Promise((resolve, reject) => {
			Promise.all([util.getLengthOfAudioFile(filePath), util.hashFile(filePath)])
				.then(([trackLengthSeconds, fileHash]) => {
					// reject files that are already in fileList (those that have already been successfully added)
					if (this::fileHasAlreadyBeenAdded(fileHash)) {
						const errMsg = fileHasAlreadyBeenAddedErrMsg(filePath);
						reject({
							err: new Error('File has already been added'),
							msg: errMsg,
							loc: 'FileList.displayFile',
							notify: true,
						});
						return;
					}

					const _trackLengthPretty = util.convertSecondsToHHMMSS(trackLengthSeconds);

					// <tr>
					//     <td class="mdl-data-table__cell--non-numeric">Track Name.ext</td>
					//     <td>hh:mm:ss</td>
					// </tr>

					// build row
					const $row = $('<tr/>')
						.append($('<td/>').addClass('mdl-data-table__cell--non-numeric').text(fileName))
						.append($('<td/>').addClass('track-length').text(_trackLengthPretty));

					// add checkbox artificially (as opposed to reinitializing table as a MaterialDataTable so that checkboxes are generated)

					const $checkbox = $('<td/>').addClass('label').append(this.trackListTable.createCheckbox_($row.get(0)));
					$row.prepend($checkbox);

					$row.appendTo($trackList.find('> tbody'));

					// hacky... use MDL api to check the checkbox?
					$row.find('input[type=checkbox]').click();

					trackLength = trackLengthSeconds;
					this.addFile(filePath, { $entry: util.withRefs($row), trackLength, fileHash });

					resolve(filePath);
				})
				.catch((err) => {
					err.notify = true;
					err.args = [filePath];

					// util.handleError(err);
					reject(err);
				});
		});
    }

	areTracksLeftForAnalysis() {
		return Array.includes($.map(this.files, file => file.completed === true), false);
	}
}
