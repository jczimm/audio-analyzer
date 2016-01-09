#!/bin/sh

diff="$(git diff --cached -U1 ../TODO.md | pv)"

msg=$(node --harmony -pe "require('./commit-todo')(\`$diff\`)")
# git commit "$msg"
echo "$msg"