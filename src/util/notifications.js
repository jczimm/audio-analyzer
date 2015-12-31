
require('../lib/snackbar/snackbar.min');

import util from './index';

//

const notifications = {};

class Notification {						// action: { text: '', click() {} }
	constructor({ style, content, timeout = 6000, action }) {
		this.style = style;
		this.timeout = timeout;

		if (!$.isEmptyObject(action)) {
			const $actionButton = $('<button/>')
				.addClass('mdl-button mdl-js-button actionbutton') // todo: style button to have white text
				.text(action.text);

			this.htmlAllowed = true;
			this.content = content + $actionButton.get(0).outerHTML;

			this.action = {
				click: action.click,
			};
		} else {
			this.htmlAllowed = false;
			this.content = content;

			this.action = false;
		}
	}

	display() {
		const $snackbar = $.snackbar({
			style: this.style,
			content: this.content,
			htmlAllowed: this.htmlAllowed,
			timeout: this.timeout,
		});

		// a second after the snackbar auto-hides,
		setTimeout(() => {
			// remove it from the DOM
			$snackbar.remove();
		}, this.timeout + 1000);

		if (this.action !== false) {
			$snackbar.find('> span > button.mdl-button').click((e) => {
				util.stopPropagation(e);
				this.action.click(arguments);
				$snackbar.remove();
			});
		}
	}
}

class ErrorNotification extends Notification {
	constructor({ content, timeout = 6000, action }) {
		super({ style: 'error', content, timeout, action });
	}
}

notifications.err = function err({ msg, action }) {
	const notification = new ErrorNotification({ content: msg, action });

	notification.display();
};

export default notifications;
