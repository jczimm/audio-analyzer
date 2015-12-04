/* global $, fileList, interfaceStateController */

// controls state of action button with jQuery (visibility is controlled by styling of `#interface`)

const states = {
	idle() {
		if (fileList.areTracksLeftForAnalysis()) {
			this.switchTo('processButton');
		}
	},
	working() {
		this.switchTo('stopButton');
	},
};
const stateNames = Object.keys(states);

//

import handleProcessButtonClick from './handleProcessButtonClick';
function bindButtonsToHandlers() {
	this.$processButton.click(handleProcessButtonClick);

	this.$stopButton.click(() => {
		interfaceStateController.state = 'stopping';
	});
}

//

export default class ActionButton {

	constructor({ $processButton, $stopButton }) {
		this.$processButton = $processButton;
		this.$stopButton = $stopButton;

		this::bindButtonsToHandlers(); // eslint-disable-line

		this.state = undefined;
	}

	switchTo(name) {
		switch (name) {
			case 'processButton':
				this.$processButton.show();
				this.$stopButton.hide();
				break;

			case 'stopButton':
				this.$stopButton.show();
				this.$processButton.hide();
				break;

			default: break;
		}
	}

	// returns boolean: whether to display the button
	updateForState(newState) {
		if (!Array.includes(stateNames, newState)) {
			throw new Error('Invalid state');
		}

		this.state = newState;
		return states[newState].apply(this);
	}
}
