/* jshint esnext: true */

import fs from 'fs';

class FileWriter {
    constructor(opt) {
    	this.dest = opt.dest;
    	this.writeStream = fs.createWriteStream(this.dest);
    }

    write() {

    }
}

export default FileWriter;
