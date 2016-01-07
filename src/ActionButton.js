/* global globals */

// controls state of action button with jQuery (visibility is controlled by styling of `#interface`)

const states = {
	idle() {
		if (globals.fileList.areTracksLeftForAnalysis()) {
			this.switchTo('processButton');
		}
	},
    testing() {
        this.switchTo('loadingButton');
    },
	working() {
		this.switchTo('stopButton');
	},
};
const stateNames = Object.keys(states);

//

import handleProcessButtonClick from './handleProcessButtonClick';
function bindButtonsToHandlers() {
	this.buttons.$processButton.click(handleProcessButtonClick);

	this.buttons.$stopButton.click(() => {
		globals.interfaceStateController.state = 'stopping';
	});
}

//

export default class ActionButton {

	constructor(buttons = { $processButton: null, $stopButton: null, $loadingButton: null }) {
        this.buttons = buttons;
        this.buttonKeys = Object.keys(buttons);

		this::bindButtonsToHandlers(); // eslint-disable-line

		this.state = undefined;
	}

	switchTo(name) {
        // hide all buttons
		for (let i = 0; i < this.buttonKeys.length; i++) {
            this.buttons[this.buttonKeys[i]].hide();
        }

        // show the button specified by `name`
        this.buttons[`$${name}`].show();
	}

	// returns boolean: whether to display the button
	updateForState(newState) {
		if (!stateNames.includes(newState)) {
			throw new Error('Invalid state');
		}

		this.state = newState;
		return states[newState].apply(this);
	}
}
