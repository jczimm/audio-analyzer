/* global $trackList */
/* jshint esnext: true */

const path = require('path');

import util from './util';
import notifications from './notifications';

//
class FileList {

    constructor (trackListTable) {
		this.trackListTable = trackListTable;
		this.files = {};
    }

    addFile (filePath, $entry, trackLength) {
		this.files[filePath] = {
			entry: $entry,
			trackLength: trackLength
		};
    }

    displayFile (filePath) {
	var self = this;

	var fileName = path.basename(filePath),
	trackLength;

	return new Promise((resolve, reject) => {
		util.getLengthOfAudioFile(filePath)
			.then((trackLengthSeconds) => {
				var _trackLengthPretty = util.convertSecondsToHHMMSS(trackLengthSeconds);
			
				// <tr>
				//     <td class="mdl-data-table__cell--non-numeric">Track Name.ext</td>
				//     <td>hh:mm:ss</td>
				// </tr>
			
				// build row
				var $row = $('<tr/>')
					.append($('<td/>').addClass('mdl-data-table__cell--non-numeric').text(fileName))
					.append($('<td/>').addClass('track-length').text(_trackLengthPretty));
			
				// add checkbox artificially (as opposed to reinitializing table as a MaterialDataTable so that checkboxes are generated)
			
				var $checkbox = $('<td/>').addClass('label').append(self.trackListTable.createCheckbox_($row.get(0)));
				$row.prepend($checkbox);
				
				$row.appendTo($trackList.find('> tbody'));
			
				// hacky...
				$row.find('input[type=checkbox]').click();
			
				trackLength = trackLengthSeconds;
				self.addFile(filePath, util.withRefs($row), trackLength);
			
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
}

export default FileList;
