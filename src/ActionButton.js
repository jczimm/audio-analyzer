/* global $, fileList */

// controls state of action button with jQuery (visibility is controlled by styling of `#interface`)
class ActionButton {
	
	constructor({ $processButton, $stopButton }) {
		
		this.$processButton = $processButton;
		this.$stopButton = $stopButton;
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
		}
	}
	
	// returns boolean: whether to display the button
	updateForState(state) {
		switch (state) {
			case 'processing':
				this.switchTo('stopButton');
				return true;
				break;

			case 'ready':
			case 'finished':
				// if there are files that are not completed
				if (Array.includes($.map(fileList.files, file => file.completed === true), false)) {
					this.switchTo('processButton');
					return true;
				} else return false;
				break;
		}
	}
}


export default ActionButton;
