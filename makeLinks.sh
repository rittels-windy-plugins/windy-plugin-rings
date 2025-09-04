#!/bin/bash         

sudo ln -f ../infoWinUtils/infoWinUtils.js  ./src/utils/infoWinUtils.js
sudo ln -f ../infoWinUtils/infoWin_style_global.less  ./src/utils/infoWin_style_global.less
sudo ln -f ../infoWinUtils/infoWin_style_svelte.less  ./src/utils/infoWin_style_svelte.less
sudo ln -f ../infoWinUtils/README.md  ./src/utils/README.md
sudo ln -f ../infoWinUtils/Footer.svelte  ./src/utils/Footer.svelte

echo "done linking!"