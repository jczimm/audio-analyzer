```
Core:
  ✔ fix audio analysis loop! @important @done (15-11-30 00:17)

  ☐ write .afa files with write-streams (don't cache the great amount of analysis data in memory before writing the files statically at the end!)
    ☐ for gzipping, after an .afa file is written, statically [read,] compress, and replace it with an .afa.gz file

  ☐ implement stereo audio analysis, "stereo mode" enabled by default (look at web-audio-analyser docs/readme for impl. through it)
  
Code Quality:

  ☐ use DocBlockr to generate simple documentation for [functions in] .js files

  Refactoring:
    ✔ standardize options-object paradigm across all functions @done (15-11-23 19:01)
      ✔ main.js @done (15-11-23 19:01)
      ✔ util.js @done (15-11-23 16:43)
      ✔ fileList.js @done (15-11-22 00:20)
      ✔ loadingStates.js @done (15-11-23 19:00)
      ✔ notifications.js @done (15-11-23 19:01)

    ☐ modularize functions in main.js (split main.js into multiple files; group functions by intuitive domain/purpose, create classes where intuitive)
    ☐ organize globals (maybe use a global.js or commons.js?)

  Style:
    ☐ configure ESLint, use eslint-config-airbnb (see https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb)

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
     ☐ Display a loading icon when files are being prepared to be displayed in the list (make the state in loadingStates.js)
     ✔ display "drop more tracks here" banner at bottom of .interface:not(.blank):not(.working) @done (15-11-21 23:29)
     ✔ format Analysis Files Destination label @done (15-11-21 23:29)

Distribution:
  ✔ fix packaging (in dist/win/Audio Analyzer for MAV-win32-ia32/, `electron` and .exe do not run app) @done (15-10-02 21:12)
  ☐ create a better icon (+ then remove attribution in CREDITS.md)

Development:
  -

Distribution:
  ☐ disable development shortcuts (e.g. CTRL+R, CTRL+SHIFT+I) in app in a non-development environment


Before Open-Sourcing:
  ☐ provide a release to the repo (an installer + the packaged application (the folder with the .exe, .dll's, folders etc.))
  ☐ add a decent CONTRIBUTING.md (link from README.md)
  ☐ create a demo gif to demo the UI and usage process (what the user does) (embed in README.md)

After Open-Sourcing:
  ☐ configure/start travis automated builds (testing), already have .travis.yml

```