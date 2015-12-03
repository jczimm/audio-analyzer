/* global destPicker */

const path = require('path');
const fs = require('fs');

import AFAFile from 'afa-file';

class FileWriter {

    constructor() {

    }

    saveDataToFile(analysis, {
        sourcePath,
        gzip = false,
        progressBar = {
            start() { },
            set(progress) { },
            error() { },
            complete() { }
        }
    }) {
        var folder = destPicker.paths[0];
        var dest = path.resolve(folder, path.basename(sourcePath)).replace(/\.[a-zA-Z]*$/i, '.afa');

        progressBar.start();

        var file = new AFAFile(analysis);

        return new Promise((resolve, reject) => {
            if (dest === __dirname) {
                return reject({
                    msg: 'Destination directory not set!',
                    loc: 'saveDataToFile',
                    notify: true
                });
            }

            if (gzip === true) {
                progressBar.set(33);

                dest += '.gz';
                file.toGzipped()
                    .then((gzipped) => {
                        progressBar.set(66);

                        // TODO: update progress of save bar as file is written
                        fs.writeFile(dest, gzipped, 'utf8', () => {
                            progressBar.set(100);
                            progressBar.complete();
                            resolve();
                        });
                    })
                    .catch((err) => {
                        progressBar.error();
                        reject({
                            err: err,
                            msg: 'Error while gzipping file',
                            loc: 'AFAFile.prototype.toGzipped',
                            notify: true
                        });
                    });
            } else {
                progressBar.set(50);
                fs.writeFile(dest, file.toString(), 'utf8', () => {
                    progressBar.set(100);
                    progressBar.complete();
                    resolve();
                });
            }
        });
    }

}


export default FileWriter;
