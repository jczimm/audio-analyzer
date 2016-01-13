# Audio Analyzer for MAV

[![bitHound Overall Score](https://www.bithound.io/projects/badges/df793470-b26d-11e5-9547-3de35bd1f61d/score.svg)](https://www.bithound.io/github/jczimm/audio-analyzer)
[![airbnb coding style](https://img.shields.io/badge/code%20style-airbnb-blue.svg)](https://github.com/airbnb/javascript)
<!-- uncomment once public
[![dependencies status](https://img.shields.io/david/jczimm/audio-analyzer.svg)](https://www.bithound.io/github/jczimm/audio-analyzer/master/dependencies/npm)
[![dev dependencies status](https://img.shields.io/david/dev/jczimm/audio-analyzer.svg)](https://www.bithound.io/github/jczimm/audio-analyzer/master/dependencies/npm)
{travis badge}
-->


Desktop application that analyzes frequency data of individual audio tracks to generate corresponding analysis files (see [.afa file format](https://github.com/jczimm/afa-file)).  For Windows, OSX, and Linux.

> TODO: test for OSX and Linux (multiple versions)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting Started](#getting-started)
- [Developers](#developers)
  - [Repo Structure](#repo-structure)
  - [Development](#development)
  - [Building the Application](#building-the-application)
  - [Packaging the Application](#packaging-the-application)
  - [Generating Installers](#generating-installers)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting Started

Go ahead and [grab an installer](https://github.com/jczimm/audio-analyzer/releases).

## Developers

```sh
git clone https://github.com/jczimm/audio-analyzer.git
cd audio-analyzer/
npm install
```

### Repo Structure

```
audio-analyzer/
├── app/					Application source is built into here
├── app.js				Controls Electron's main process
├── assets/				Assets used by packaged application, installers
│   ...
├── dist/					Application is packaged into here (releases, installers)
│   ...
├── packager.json			Used by `electron-builder` for packaging the application 
│   ...
├── src/					Application source
│   │   ...
│   ├── index.html		Electron app entry point
│   │   ...
│   ├── main.js			Main application script (among other scripts)
│   │   ...
│   ├── package.json		Used for app entry in packaged application
│   └── ...
└── util/					Development utility scripts (used in app.js and gulpfile.js)
```

### Development

To open the application and reload the brower window upon changes in `src` and the renderer upon changes to `app.js`:

```sh
gulp dev
```

To simulate the application in "production" (in a non-development environment):

```sh
electron app
```

### Building the Application

```sh
gulp build
```

> Transpiles ES6 javascript, compiles scss, and copies the rest from `src/` -- and `app.js` -- into `app/`

### Packaging the Application 

```sh
# Package for both Windows and OSX
npm run build

# Package for Windows
npm run build:win

# Package for OSX
npm run build:osx
```

> Generates folder(s) with a rebranded electron executable in a context to launch the application (outputs into dist/)


`build`, `build:win`, and `build:osx` build everything in src/, so if you want to build only the files that have been modified since the last build, add `:update` to the script name (i.e. `npm run build:update`, `npm run build:win:update`, or `npm run build:osx:update`)


[//]: # (**Note:** Windows does not support packaging the app for OSX as it involves symlinks, which Windows cannot create.)


### Generating Installers

```sh
# Generate installers for both Windows and OSX
npm run pack

# Generate installers for Windows
npm run pack:win

# Generate installers for OSX
npm run pack:osx
```

> Generates installers for the packaged application (outputs to `dist/`)


## Documentation

> TODO


## Contributing

> TODO


## License

MIT © [Jacob Zimmerman (jczimm)](http://jczimm.com) – [LICENSE.md](https://github.com/jczimm/audio-analyzer/blob/master/LICENSE.md) contains a copy of the license.
