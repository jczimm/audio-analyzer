/* global __appdirname */

const path = require('path');

import AudioAnalyzer from './AudioAnalyzer';
//

const testAudioPath = path.resolve(__appdirname, './test.wav');

export default class TestAudioAnalyzer extends AudioAnalyzer {
    testAudioAnalysis() {
        return super.analyzeAudioTrack(testAudioPath, {
            fileHash: new Date().toISOString(),
            trackLength: 1,
        });
    }
}
