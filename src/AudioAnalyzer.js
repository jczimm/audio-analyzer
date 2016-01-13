/* global globals */

const path = require('path');

import util from './util';

//          british spelling for 'web-audio-analyser's wrapper
import audioAnalyser from 'web-audio-analyser';

//                        and american spelling for our class
export default class AudioAnalyzer {
    constructor() {
        // create an Audio instance to use for the current analyses
        this.audio = new Audio();
        this.audio.autoplay = false;
        this.audio.preload = 'auto';
        this.audio.crossOrigin = 'anonymous';
        this.audio.volume = 1;

        // create audio analyzer from 'web-audio-analyser's `WebAudioAnalyser` (with british spelling b/c from the module)
        this.analyser = audioAnalyser(this.audio, globals.audioCtx, util.analyzerOptions);
        this.analyser.analyser.smoothingTimeConstant = 0.3;

        //

        this.doneAnalyzing = false;
    }

    onAudioEnded() {
        this.doneAnalyzing = true;

        if (this.mode === 'fast') {
            globals.loopsController.clearInterval(`analysis:${this.fileHash}`);
        } else {
            globals.loopsController.clearLoop(`analysis:${this.fileHash}`);
        }

        // if analysis is currently stopping or has been stopped (interface now in idle state),
        if (globals.interfaceStateController.isState(['stopping', 'idle'])) {
            this.response.reject({
                msg: 'oh, stopped... ignore me, just breaking the sequence',
                loc: 'analyzeAudioTrack',
                fine: true,
            });
            this.progressBar.complete(); // bug-fixing bkp
        } else { // else, resolve results
            console.log('successfully created .afa file for %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(this.filePath));

            const results = {
                analysis: {
                    data: this.afaData, // array of Uint8Array's
                    freqBinCount: this.freqBinCount,
                    sampleRate: this.pointsPerSecond,
                },
                sourcePath: this.filePath,
            };

            // update progress bar to complete state
            this.progressBar.complete();

            // end progress loop
            globals.loopsController.clearInterval(`progress:${this.fileHash}`);

            this.response.resolve(results);
        }
    }

    onAudioError(e) {
        this.doneAnalyzing = true;

        const errorInfo = util.handleAudioLoadError(e);

        // clear progress interval, analysis loop
        globals.loopsController.clearInterval(`progress:${this.fileHash}`);
        globals.loopsController.clearLoop(`analysis:${this.fileHash}`);

        // convey error in progress bar
        this.progressBar.error(errorInfo);
        errorInfo.notify = true;
        this.response.reject(errorInfo);
    }

    onAudioReady() {
        if (!this.first) return; // handling mysterious duplicate `audio`s being created for a single source
        this.first = false;

        // remove an indeterminate status from progress bar
        this.progressBar.start();

        // analyze the audio file
        console.log('analyzing %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(this.filePath));

        //  ______/\\\\\\\\\____________/\\\\\\\\\___/\\\\\\\\\\\\\\\___/\\\\\\\\\\\________/\\\\\________/\\\\\_____/\\\_
        //  ____/\\\\\\\\\\\\\_______/\\\////////___\///////\\\/////___\/////\\\///_______/\\\///\\\_____\/\\\\\\___\/\\\__
        //  ___/\\\/////////\\\____/\\\/__________________\/\\\____________\/\\\________/\\\/__\///\\\___\/\\\/\\\__\/\\\__
        //  __\/\\\_______\/\\\___/\\\____________________\/\\\____________\/\\\_______/\\\______\//\\\__\/\\\//\\\_\/\\\__
        //  __\/\\\\\\\\\\\\\\\__\/\\\____________________\/\\\____________\/\\\______\/\\\_______\/\\\__\/\\\\//\\\\/\\\__
        //  __\/\\\/////////\\\__\//\\\___________________\/\\\____________\/\\\______\//\\\______/\\\___\/\\\_\//\\\/\\\__
        //  __\/\\\_______\/\\\___\///\\\_________________\/\\\____________\/\\\_______\///\\\__/\\\_____\/\\\__\//\\\\\\__
        //  __\/\\\_______\/\\\_____\////\\\\\\\\\________\/\\\_________/\\\\\\\\\\\_____\///\\\\\/______\/\\\___\//\\\\\__
        //  __\///________\///_________\/////////_________\///_________\///////////________\/////________\///_____\/////___


        this.audio.play();

        // if fast mode, create analysis interval
        if (this.mode === 'fast') {
            globals.loopsController.createInterval(`analysis:${this.fileHash}`, this.analysisInterval(),
                { interval: this.analysisIntervalInterval });
        } else { // else, create analysis loop
            globals.loopsController.createLoop(`analysis:${this.fileHash}`, this.analysisLoop());
        }

        // update progress bar in a separate detached interval (loopsController uses setInterval internally)
        globals.loopsController.createInterval(`progress:${this.fileHash}`, this.progressInterval(), { interval: 50 });
    }

    analysisLoop() {
        let frequencies;
        return (next) => {
            if (this.doneAnalyzing || globals.interfaceStateController.isState(['stopping', 'idle'])) {
                this.doneAnalyzing = true;
                return next('break');
            }

            frequencies = util.normalize(this.analyser.frequencies(), {
                from: 0,
                to: 100,
                alreadyNormalized: { // just scale the values; `getByteFrequencyData` outputs a normalized array from 0 - 255
                    from: 0,
                    to: 255,
                },
            });
            this.afaData.push(frequencies);

            // set the progress // change the current time of the audio by the "speed"
                                // (1 / pointsPerSecond; secondsPerPoint, as `currentTime` is in seconds)
            this.progress = (this.audio.currentTime += this.speed) / this.trackLength;

            next();
        };
    }

    analysisInterval() {
        let frequencies;
        return () => {
            if (this.doneAnalyzing || globals.interfaceStateController.isState(['stopping', 'idle'])) {
                this.doneAnalyzing = true;
                return 'break';
            }

            frequencies = util.normalize(this.analyser.frequencies(), {
                from: 0,
                to: 100,
                alreadyNormalized: { // just scale the values; `getByteFrequencyData` outputs a normalized array from 0 - 255
                    from: 0,
                    to: 255,
                },
            });
            this.afaData.push(frequencies);

            this.progress = this.audio.currentTime / this.trackLength;
        };
    }

    progressInterval() {
        return () => {
            if (this.doneAnalyzing || globals.interfaceStateController.isState(['stopping', 'idle'])) {
                this.doneAnalyzing = true;
                return 'break';
            }

            // update progress bar
            this.progressBar.set(this.progress);
        };
    }

    analyzeAudioTrack(filePath, {
        pointsPerSecond = 1000,
        mode = 'normal',
        fileHash,
        trackLength,
        progressBar = {
            start() { },
            set(progress) { }, // eslint-disable-line no-unused-vars
            error() { },
            complete() { },
        },
        customOnAudioReady, // optional
    }) {
        return new Promise((resolve, reject) => {
            // > lights...

            this.doneAnalyzing = false;

            this.first = true;

            this.progress = 0;

            this.filePath = filePath;
            this.pointsPerSecond = pointsPerSecond;
            this.mode = mode;
            this.fileHash = fileHash;
            this.trackLength = trackLength;
            this.progressBar = progressBar;

            this.response = { resolve, reject };


            if (this.mode === 'fast') {
                // - if sample rate <= 1000 Hz, then analysis interval = (1000 / sample rate) ms, playback speed = 1
                // - else (if sample rate > 1000 hz), then analysis interval = 1 ms, playback speed = (1000 / sample rate)
                if (this.pointsPerSecond <= 1000) {
                    this.audio.playbackRate = 1;
                    this.analysisIntervalInterval = 1000 / this.pointsPerSecond;
                } else {
                    this.audio.playbackRate = 1000 / this.pointsPerSecond;
                    this.analysisIntervalInterval = 1;
                }
            } else {
                this.speed = 1 / this.pointsPerSecond;
                this.audio.playbackRate = 0;
            }

            this.freqBinCount = this.analyser.analyser.frequencyBinCount;
            this.afaData = [];

            // > camera...

            // note: although the audio file will not be "played" regularly, this event will still be
            //       triggered when `audio.currentTime` is set to a value >= `audio.duration` in `analysis:${this.fileHash}` loop
            this.audio.addEventListener('ended', ::this.onAudioEnded, false);
            this.audio.addEventListener('error', ::this.onAudioError, false);
                                                    // if custom `onAudioReady` handler provided, use it
            this.audio.addEventListener('canplaythrough', this::(customOnAudioReady || this.onAudioReady), false);

            // > action! (`onAudioReady` is run when 'canplaythrough' event is triggered)
            this.audio.src = this.filePath;
        });
    }
}
