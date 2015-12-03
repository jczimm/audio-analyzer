/* global interfaceStateController, loopsController */

const path = require('path');

import util from './util';

import audioAnalyzer from 'web-audio-analyser';

export default function analyzeAudioTrack(filePath, {
    pointsPerSecond = 1000,
    trackLength,
    progressBar = {
        start() { },
        set(progress) { },
        error() { },
        complete() { }
    }
}) {
    return new Promise((resolve, reject) => {
        var audio = new Audio();

        // configure `audio`
        audio.autoplay = false;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.volume = 1;
        audio.playbackRate = 0;

        audio.src = filePath;

        var analyzer = audioAnalyzer(audio, util.analyzerOptions);
        analyzer.analyser.smoothingTimeConstant = 0.3;

        var frequencies,
            freqBinCount = analyzer.analyser.frequencyBinCount,
            afaData = [];
        
        //
        
        var fileHash = '[FILE\'S CRYPTO DIGEST]'; // from `file` in `fileList.files`, `digest` property set in FileList.js
                
        //
        
        var doneAnalyzing = false;

        // although the audio file will not be "played" regularly, this event will still be
        // triggered when `audio.currentTime` is set to a value >= `audio.duration` in `analysis:${fileHash}` loop
        audio.addEventListener('ended', () => {
            
            doneAnalyzing = true;

            loopsController.clearLoop(`analysis:${fileHash}`);
            
            // if analysis is currently stopping or has been stopped (interface now in idle state),
            if (interfaceStateController.isState('stopping') || interfaceStateController.isState('idle')) {
                // then close audio context and exit
                analyzer.ctx.close().then(() => {
                    reject({
                        msg: 'oh, stopped... ignore me, just killing the sequence',
                        loc: 'analyzeAudioTrack',
                        fine: true
                    });
                });
            } else { // else, resolve results
                console.log('successfully created .afa file for %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(filePath));

                var results = {
                    analysis: {
                        data: afaData,
                        freqBinCount: freqBinCount // array of Uint8Array's
                    },
                    sourcePath: filePath
                };
    
                // clean up audio context
                analyzer.ctx.close().then(() => {
                    // update progress bar to complete state
                    progressBar.complete();
                    
                    // end progress loop
                    loopsController.clearInterval(`progress:${fileHash}`);

                    resolve(results);
                });
            }
        });

        audio.addEventListener('error', (e) => {
            doneAnalyzing = true;
            
            var errorInfo = util.handleAudioLoadError(e);

            // clean up audio context
            analyzer.ctx.close().then(() => {
                // clear progress interval, analysis loop
                loopsController.clearInterval(`progress:${fileHash}`);
                loopsController.clearLoop(`analysis:${fileHash}`);

                // convey error in progress bar
                progressBar.error(errorInfo);
                errorInfo.notify = true;
                reject(errorInfo);
            });
        });


        var speed = 1 / pointsPerSecond;

        var progress = 0,
            first = true;
            
        audio.addEventListener('canplaythrough', (e) => {
            if (first) { // handling mysterious duplicate `audio`s being created for a single source
                first = false;

                // remove an indeterminate status from progress bar
                progressBar.start();

                // analyze the audio file
                console.log('analyzing %c%s', 'font-weight: 600; font-size: 1.2em;', path.basename(filePath));
                
                //  ______/\\\\\\\\\____________/\\\\\\\\\___/\\\\\\\\\\\\\\\___/\\\\\\\\\\\________/\\\\\________/\\\\\_____/\\\_
                //  ____/\\\\\\\\\\\\\_______/\\\////////___\///////\\\/////___\/////\\\///_______/\\\///\\\_____\/\\\\\\___\/\\\__
                //  ___/\\\/////////\\\____/\\\/__________________\/\\\____________\/\\\________/\\\/__\///\\\___\/\\\/\\\__\/\\\__
                //  __\/\\\_______\/\\\___/\\\____________________\/\\\____________\/\\\_______/\\\______\//\\\__\/\\\//\\\_\/\\\__
                //  __\/\\\\\\\\\\\\\\\__\/\\\____________________\/\\\____________\/\\\______\/\\\_______\/\\\__\/\\\\//\\\\/\\\__
                //  __\/\\\/////////\\\__\//\\\___________________\/\\\____________\/\\\______\//\\\______/\\\___\/\\\_\//\\\/\\\__
                //  __\/\\\_______\/\\\___\///\\\_________________\/\\\____________\/\\\_______\///\\\__/\\\_____\/\\\__\//\\\\\\__
                //  __\/\\\_______\/\\\_____\////\\\\\\\\\________\/\\\_________/\\\\\\\\\\\_____\///\\\\\/______\/\\\___\//\\\\\__
                //  __\///________\///_________\/////////_________\///_________\///////////________\/////________\///_____\/////___                       
                                                 
                
                audio.play();
                
                loopsController.createLoop(`analysis:${fileHash}`, (next, err, data) => {
                    if (doneAnalyzing || interfaceStateController.isState('stopping') || interfaceStateController.isState('idle')) {
                        doneAnalyzing = true;
                        return next("break");
                    }

                    frequencies = util.normalize(analyzer.frequencies(), {
                        from: 0,
                        to: 100,
                        alreadyNormalized: { // just scale the values; `getByteFrequencyData` outputs a normalized array from 0 - 255
                            from: 0,
                            to: 255
                        }
                    });
                    afaData.push(frequencies);

                    progress = (audio.currentTime += speed) / trackLength;
                    next();
                });

                // update progress bar in a separate detached interval (LoopsController uses setInterval internally)
                loopsController.createInterval(`progress:${fileHash}`, () => {
                    if (doneAnalyzing || interfaceStateController.isState('stopping') || interfaceStateController.isState('idle')) {
                        doneAnalyzing = true;
                        return;
                    }
                    
                    // update progress bar
                    progressBar.set(progress);
                }, { interval: 50 });
            }
        }, false);
    });
}
