/* global globals */

const path = require('path');

import util from './util';

//

function fileHasAlreadyBeenAdded(fileHash) {
    return $.map(this.files, file => file.fileHash === fileHash).includes(true);
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

    async displayFile(filePath) {
		const fileName = path.basename(filePath);

		let trackLength;

        try {
            const [trackLengthSeconds, fileHash] = await Promise.all([util.getLengthOfAudioFile(filePath), util.hashFile(filePath)]);
            if (this::fileHasAlreadyBeenAdded(fileHash)) {
                return {
                    err: new Error('File has already been added'),
                    msg: fileHasAlreadyBeenAddedErrMsg(filePath),
                    loc: 'FileList.displayFile',
                    notify: true,
                };
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

            // add checkbox artificially
            // (as opposed to reinitializing table as a MaterialDataTable

            const $checkbox = $('<td/>').addClass('label').append(this.trackListTable.createCheckbox_($row.get(0)));
            $row.prepend($checkbox);

            $row.appendTo(globals.$trackList.find('> tbody'));

            // hacky... use MDL api to check the checkbox?
            $row.find('input[type=checkbox]').click();

            trackLength = trackLengthSeconds;
            this.addFile(filePath, { $entry: util.withRefs($row), trackLength, fileHash });

            return filePath;
        } catch (err) {
            err.notify = true;
            err.args = [filePath];

            // util.handleError(err);
            return err;
        }
    }

	areTracksLeftForAnalysis() {
		return $.map(this.files, file => file.completed === true).includes(false);
	}

    areTracksLeft() {
		return Object.keys(this.files).length > 0;
	}
}
