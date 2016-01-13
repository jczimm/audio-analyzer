/* global globals */

import handleFiles from './handleFiles.js';


// blank:		in blank state, track list is empty
// handling:    (intermediate state) filtering & preparing the files; copying them to tmp, displaying them in the track list
// idle:		track list has entries (an entry), entries may or may not be selected
// testing:     (intermediate state) program is testing whether audio analysis is working
// working:		program is analyzing track(s)
// stopping:	(intermediate state) analysis has been interrupted (by user or otherwise), going from working to idle state

//                                       .-----------------------------.
//                              ^`\      V--------------.              |
// +-----------+    : - - - - -|:  v-----+-----+  : - - ? - - :  +-----?-----+    : - - - - - :
// |     -     |         ...   `<<?|     .     |        ``       |     %     |          x
// |   Blank   | -> >> Handling +> |   Idle    |-> >> Testing +> |  Working  | -> >> Stopping |
// |   .blank  |      .handling    |  .done?   |                 |  .working |          v
// +-----+-----+    : - - ? - - :  +----+------+  : - - - - - :  +-----------+    : - - + - - :
//       ^                V             ^                                               V
//       `<- <- <- <- <<-`/             `<- <- <- <- <- <- <- <- <- <- <- <- <- <- < <-'/

//

const states = {
	blank() {
        globals.$interface.addClass('blank').removeClass('done working');
	},
    handling() {
        globals.$interface.addClass('handling').removeClass('blank idle');

        globals.actionButton.updateForState('handling');
    },
	idle() {
		// remove the classes corresponding to all possibles states from which the interface could now be changing
		// > this animates in the '#process-button' FAB (via CSS)
		globals.$interface.removeClass('handling working');

		globals.actionButton.updateForState('idle');

		globals.$interface.removeClass('done'); // re-setting below if applicable
		if (!globals.fileList.areTracksLeftForAnalysis()) {
			// add .done class
			globals.$interface.addClass('done');
		}
	},
    testing() {
        globals.actionButton.updateForState('testing');
    },
	working() {
				// .done might not be present
		globals.$interface.removeClass('done').addClass('working');

		// tell actionButton we're working; switches to stop button
		globals.actionButton.updateForState('working');
	},
	stopping() {
		// clear all loops through loopController
		globals.loopsController.clearAllLoops();
		globals.loopsController.clearAllIntervals();

		// remove all progress bars:

		const files = globals.fileList.files;
		const fileIds = Object.keys(files);
		let $entry, $checkbox,
			tmpFilePath;

		// for each file
		for (let i = 0; i < fileIds.length; i++) {
			// for its corresponding entry element,
			tmpFilePath = fileIds[i];
			$entry = files[tmpFilePath].entry;

			// remove the progress bar
			$entry.find('.mdl-progress').remove();

			// re-enable the checkbox
			$checkbox = $entry.find('> td.label > .mdl-checkbox input[type=checkbox]').prop('disabled', false).parent().get(0);
			if ($checkbox) $checkbox.MaterialCheckbox.checkDisabled();
		}

		// no need to repeat code; instruct the controller to set the final state to idle
		this.state = 'idle';
	},
};
const stateNames = Object.keys(states);

function bindBodyHandlers() {
	// handle file-dropping
	$('body')
		.on('drop', (e) => {
			e.stopPropagation();
			e.preventDefault();

			const droppedFiles = e.originalEvent.dataTransfer.files;

			// if not in working state,
			if (!this.isState('working')) {
				// handle the files (filter & prepare the files; copy them to tmp, display them in the track list)
				handleFiles(droppedFiles[0] ? droppedFiles : e.target.files);
			}
		})
		.on('dragover', (e) => {
			e.stopPropagation();
			e.preventDefault();

			// if not in working state,
			if (!this.isState('working')) {
				// show the "copy" drop effect (i.e. with plus sign on win chrome)
				e.originalEvent.dataTransfer.dropEffect = 'copy';
			} // (don't show when working because ondrop won't take the files then)
		});
}

const handlersForStates = {
	blank() {
		$('#interface, div#upload-button, #interface #blank-state-text').click(() => {
			globals.$fileInput.click();
		});
	},
	idle() {
		// unbind blank state click handlers (i.e. unbind from clicking $fileInput)
		$('#interface, div#upload-button, #interface #blank-state-text').off('click');
		// todo: optimize (use the globals?) ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^
	},
};
const handlersForStatesStatesNames = Object.keys(handlersForStates);

function bindElementsForState(newState) {
	if (handlersForStatesStatesNames.includes(newState)) {
		handlersForStates[newState]();
	} // (don't throw an error since we don't have handlers to bind for entering all states)
}

//

let state;
export default class InterfaceStateController {

	constructor() {
		this::bindBodyHandlers(); // eslint-disable-line
	}

	get state() {
		return state;
	}

	set state(newState) {
		if (stateNames.includes(newState)) {
			state = newState;
			this::states[newState](); // eslint-disable-line

			bindElementsForState(newState);
		} else {
			throw new Error('Cannot set interface state: Invalid state');
		}
	}

	isState(_state) {
        // if passed an array,
		return typeof _state === 'object'
            ? _state.includes(this.state) // return if one of the elements is `this.state`
            : this.state === _state; // else, return if `_state` is `this.state`
	}
}
