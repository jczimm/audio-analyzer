var fs = require('fs');

var util = require('./util');

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

	var frequencies = analyzer.waveform();

	console.log(frequencies);
}