/* global __appdirname */
/* global globals */

// TODO: clean up format

import TestAudioAnalyzer from '../TestAudioAnalyzer';

const testAudioAnalysisErrInfo = (e) => ({
    err: e,
    msg: 'Audio analysis doesn\'t seem to be working... Try again?',
    loc: 'util.testAudioAnalysis',
    notify: true,
});

// note: `testAudioPath`, `testAudio`, and `testAnalyser` are all returned by functions because this module is imported from util,
//        which is imported quite a lot; to have these objects created every time util is required would be a waste of time, as
//        this module is only used in a couple of places
export default {
    testAudioAnalysis() {
        return new Promise((resolve, reject) => {
            new TestAudioAnalyzer().testAudioAnalysis()
                .then(resolve)
                .catch((e) => {
                    reject(testAudioAnalysisErrInfo(e));
                }); // handle error in testAudio.js
        });
    },
};
