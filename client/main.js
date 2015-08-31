var fs = require('fs'),
	path = require('path');

var util = require('./util');
var AFAFile = require('afa-file');

//

function handleFiles(input) {
    var files = $(input).get(0).files,
        filePaths = [];

    [].slice.call(files).forEach(function(file) {
        filePaths.push(file.path);
    });

    util.tmp.copyFilesToTmp(filePaths)
        .then(function(tmpFilePaths) {
            tmpFilePaths.map(analyzeAudioTrack);
        })
        .catch(function(err) {
            console.error("ERR in util.copyFilesToTmp: ", err);
        });
}

function analyzeAudioTrack(url) {
    var audio = new Audio();
    audio.src = url;

    var analyzer = require('web-audio-analyser')(audio, util.analyzerOptions);
    analyzer.analyser.smoothingTimeConstant = .3;

    var frequencies, afaData = [];

    audio.addEventListener("ended", function() {
		clearInterval(analysisLoop);
		saveDataToFile(afaData, url, analyzer);
	});

    audio.play();

    var analysisLoop = setInterval(function() {
        frequencies = util.normalize(analyzer.frequencies(), 0, 100);
        afaData.push(frequencies);
    }, 1);
}

function saveDataToFile(afaData, url, analyzer) {
	var freqBinCount = analyzer.analyser.frequencyBinCount;

	var dest = path.resolve(__dirname, url).replace(/\.[a-zA-Z]*$/i, ".afa");

	var file = new AFAFile({
		freqBinCount: freqBinCount,
		data: afaData // array of Uint8Array's
	});

	file.toGzipped()
		.then(function(gzipped) {
			fs.writeFileSync(dest, gzipped, "utf8");
		})
		.catch(function(err) {
			console.error("ERR while gzipping .afa file:", err);
		});
}