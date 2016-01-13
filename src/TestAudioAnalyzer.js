/* global globals, __appdirname */

const path = require('path');

import AudioAnalyzer from './AudioAnalyzer';
//

function setNewAudioCtx() {
    globals.audioCtx = null; // necessary? probably not
    globals.audioCtx = new AudioContext();
}


const testAudioPath = path.resolve(__appdirname, './test.wav');

export default class TestAudioAnalyzer extends AudioAnalyzer {
    testAnalyzeSample() {
        const freqData = new Uint8Array(1);
        return (next) => {
            if (this.audio.currentTime === 0 || this.audio.currentTime === this.audio.duration) {
                console.info('audio did not play or ended');
                next('break');
                return;
            }
            this.analyser.analyser.getByteFrequencyData(freqData);
            this.afaData[0] = freqData; // no need to re-normalize...
            this.audio.currentTime += 0.1;
            next();
        };
    }
    testAudioAnalysis() {
        // handle disambiguation in `TestAudioAnalyzer` ('proxy' `analyzeAudioTrack`'s result (fulfillment/rejection))
        return new Promise((resolve, reject) => {
            super.analyzeAudioTrack(testAudioPath, {
                fileHash: new Date().toISOString(),
                trackLength: 1,
                customOnAudioReady() { // provide custom "canplaythrough" handler
                    // this.onAudioReady(); // backup for broken test

                    if (!this.first) return; // handling mysterious duplicate `audio`s being created for a single source
                    this.first = false;

                    // FIXME:

                    // recreate the audio context
                    const closing = globals.audioCtx.close(); // close it
                    closing.then(setNewAudioCtx, setNewAudioCtx).then(() => { // then recreate it, ignoring any errors closing it
                        // this cannot be chained to the above because it (seems to) soften all rejections into resolves...
                        // so we must operate directly on the original promise
                        closing.then(() => {
                            globals.audioCtx = new AudioContext();

                            this.audio.playbackRate = 0.3; // arbitrary num > 0

                            this.audio.play();

                            setTimeout(() => {
                                if (this.audio.currentTime === 0) this.response.reject(new Error('Audio did not play'));
                            }, 300);

                            globals.loopsController.createLoop(`analysis:test`, this.testAnalyzeSample());
                        }).catch(() => {
                            this.response.reject(new Error('Error closing `globals.audioCtx` did not play'));
                        });
                    });
                },
            })
                .then((result) => {
                    const sampleFreqData = result.analysis.data[0];
                                    // FIXME.. not robust checking..?
                    if (sampleFreqData && sampleFreqData[0] !== 0) {
                        resolve(result);
                        return;
                    }
                    reject(new Error('No frequency data in the first frequency data point'));
                })
                .catch(reject);
        });
    }
}
