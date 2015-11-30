/* global $, fileList */

class ActionButton {
	constructor({ $processButton, $stopButton }) {

		this.$processButton = $processButton;
		this.$stopButton = $stopButton;
	}

	showButton(name) {
		switch (name) {
			case 'processButton':
				this.$processButton.show();
				this.$stopButton.hide();
				break;

			case 'stopButton':
				this.$stopButton.show();
				this.$processButton.hide();
				break;
		}
	}

	hideButton() {
		this.$processButton.hide();
		this.$stopButton.hide();
	}

	updateForState(state) {
		switch (state) {
			case 'processing':
				this.showButton('stopButton');
				break;

			case 'finished':
				// if there are files that are not completed
				if (Array.includes($.map(fileList.files, file => file.completed === true), false)) {
					this.showButton('processButton');
				} else {
					this.hideButton();
				}
				break;
		}
	}

	// handleTrackListChange() {
		
	// }
}


export default ActionButton;
