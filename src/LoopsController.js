import Loop from 'loop';


export default class LoopsController {
	constructor() {
		this.loops = {};
		this.intervals = {};
	}

	createLoop(loopId, fn) {
		if (!loopId) throw new Error('Must specify loop id');
		if (!fn) throw new Error('Must specify loop function');

		console.info('creating loop %s', loopId);

		const loop = new Loop();

		this.loops[loopId] = loop;
		loop.run(fn);
	}

	createInterval(intervalId, fn, { interval }) {
		if (!intervalId) throw new Error('Must specify interval id');
		if (!fn) throw new Error('Must specify interval function');
		if (!interval) throw new Error('Must specify interval interval (ms between each execution)');

		console.info('creating interval %s', intervalId);

		this.intervals[intervalId] = setInterval(fn, interval);
	}

	clearLoop(loopId) {
		// delete it from the loops obj (is time saved by deleting > time spent deleting?)
		console.info('deleting loop %s', loopId);
		delete this.loops[loopId];
	}

	clearInterval(intervalId) {
		console.info('clearing interval %s', intervalId);
		clearInterval(this.intervals[intervalId]);
		delete this.intervals[intervalId];
	}

	clearLoops(loopIds = []) {
		for (let i = 0; i < loopIds.length; i++) {
			this.clearLoop(loopIds[i]);
		}
	}

	clearIntervals(intervalIds = []) {
		for (let i = 0; i < intervalIds.length; i++) {
			this.clearInterval(intervalIds[i]);
		}
	}

	clearAllLoops() {
		this.clearLoops(Object.keys(this.loops));
	}

	clearAllIntervals() {
		this.clearIntervals(Object.keys(this.intervals));
	}
}
