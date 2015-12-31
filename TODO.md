```
Core:
  ✔ fix audio analysis loop! @important @done (15-11-30 00:17)

  ✔ create crypto digests of files imported @done (15-12-03 20:44)
  ✔ use files' crypto digests to prevent files from being imported twice @done (15-12-04 23:27)
  ✔ use files' crypto digests as ids in fileList.files and for tagging loops (in loopsController.loops) @done (15-12-04 23:27)

  ✔ implement "fast mode"; instead of reading freq data in measures according to the sample rate, read freq data live at set intervals from the audio file, playing back at a given speed @done (15-12-16 19:20)
    - if sample rate <= 1000 Hz, then analysis interval = (1000 / sample rate) ms, playback speed = 1
    - else (if sample rate > 1000 hz), then analysis interval = 1 ms, playback speed = (1000 / sample rate)

  ☐ use a test .wav file to test whether or not computer audio output is working correctly (play it and analyze time domain data; if array is [0..], don't proceed with analysis processes (make a toast notification... maybe with longer timeout?)) 

  ☐ write .afa files with write-streams (don't cache the great amount of analysis data in memory before writing the files statically at the end!)
    ☐ for gzipping, after an .afa file is written, statically [read,] compress, and replace it with an .afa.gz file

  ☐ implement stereo audio analysis, "stereo mode" enabled by default (look at web-audio-analyser docs/readme for impl. through it)

  ☐ use a symbol for each track to tag its analysis loop/interval and progress interval; store the symbols as properties of the files in the file list @idea

  ☐ compile some "pure" parts of util methods into .wasm files for speed? @idea
    ('pure' as in: 'manipulating 0-dimensional primitives', i.e. non-array-non-objects)
    e.g: restructure `util.normalize` so that it maps the values in the input array
         to the results of a function taking
           `val, min, rangeChange, from`
         and returning
           `(((val - min) * rangeChange) || 0) + from`
         (see util/index.js...)
    > determine potential speed improvement first?
  
Code Quality:

  ☐ use DocBlockr to generate simple documentation for [functions in] .js files
  ☐ convert .js files to typescript (don't forget to use `interface`, seems useful for the code)

  Refactoring:
    ✔ standardize options-object paradigm across all functions @done (15-11-23 19:01)
      ✔ main.js @done (15-11-23 19:01)
      ✔ util.js @done (15-11-23 16:43)
      ✔ fileList.js @done (15-11-22 00:20)
      ✔ loadingStates.js @done (15-11-23 19:00)
      ✔ notifications.js @done (15-11-23 19:01)

    ✔ modularize functions in main.js (split main.js into multiple files; group functions by intuitive domain/purpose, create classes where intuitive) @done (15-12-03 00:39)
    ✔ organize globals (maybe use a global.js or commons.js?) @done (15-12-03 00:39)

  Style:
    ✔ configure ESLint, use eslint-config-airbnb (see https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb) @done (15-12-06 18:55)

    ☐ apply rscss style guide to html and scss files (see http://rscss.io)
      - edit index.html
      - reorganize + re-style styles in style.scss into components/*.scss (one file for each 'component'; see rscss spec)

UI:
  TODO's related to the user interface of the program.

    Track Analysis:
     ✔ disable checkbox when analyzing a track @done (15-10-01 09:32)
     ✔ when track analysis errs, turn progress bar red @done (15-10-01 09:38)
     ☐ FIXME: show a progress bar when saving an .afa file (replace .analysis-progress with an accent-color bar)
     ☐ add small, animated loader (animated icon) onto cards in place of disabled checkbox during analysis

    General: 
     ☐ Implement electron-drag for title bar (replacing -webkit-app-region) (https://github.com/kapetan/electron-drag)
     ☐ Display a loading icon when files are being prepared to be displayed in the list (make the state in loadingStates.js) @flagged
     ✔ display "drop more tracks here" banner at bottom of .interface:not(.blank):not(.working) @done (15-11-21 23:29)
     ✔ format Analysis Files Destination label @done (15-11-21 23:29)

     ☐ adhere interface writing to rules at https://www.google.com/design/spec/style/writing.html and look at https://signalvnoise.com/posts/3633-on-writing-interfaces-well
       - keep in mind over the course of the development of the program (make a Writing-Style.md with a version of these rules for contributors to follow?)

Distribution:
  ✔ fix packaging (in dist/win/Audio Analyzer for MAV-win32-ia32/, `electron` and .exe do not run app) @done (15-10-02 21:12)
  ☐ create a better icon (+ then remove attribution in CREDITS.md)
  ☐ disable development shortcuts (e.g. CTRL+R, CTRL+SHIFT+I) in app in a non-development environment

Development:
  ☐ create a static/ folder at root and have gulp copy the lib/, test.wav, and other static  files from there (when dirty) to the app/ folder
    (and have gulp clear app/ in build)

Before Open-Sourcing:
  ☐ test development experience (cloning, installing deps (incl dev deps), and using the npm scripts)
  ☐ download icon font files and Roboto font files into assets/ and reference them from there (all resources must be offline for the application to be offline-compatible)
  ☐ provide a release to the repo (an installer + the packaged application (the folder with the .exe, .dll's, folders etc.))
  ☐ add a decent CONTRIBUTING.md (link from README.md)
  ☐ create a demo gif to demo the UI and usage process (what the user does) (embed in README.md)

After Open-Sourcing:
  ☐ configure/start travis automated builds (testing), already have .travis.yml

```