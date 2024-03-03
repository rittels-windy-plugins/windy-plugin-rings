#!/usr/bin/env node

// rollup-plugin that allows insertion and removal of a global css stylesheet.
// src/global.less is compiled to css and added to globalCss.js,  which is then imported into plugin.svelte.

import fs from 'fs';
import path from 'path';
import less from 'less';
import * as tsImport from 'ts-import';

const { join } = path;
let { log } = console;

// Main

function template(name, css) {
    return `
const globalCss = `+

 "`<style id='stylesheet-for-"+name+"'>"+css+"</style>`;"+

`
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-${name}")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-${name}");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
`;
}

export const makeGlobalCss = function () {
    return {
        name: "make-global-css",
        async buildStart() {
            const config = (await tsImport.load('./src/pluginConfig.ts')).default;
            const { name } = config;
            let lessFile = "./src/global.less";
            try {
                let lessContent;
                try {
                    lessContent = fs.readFileSync(lessFile, "utf-8");
                } catch (e){
                    console.log("no global.less file.   Do not import ./globalCss.js.");
                    return "no global.less available.";
                }
                let { css } = await less.render(lessContent, { cleancss: true, compress: true });
                if (!css) {
                    console.log("No CSS made.   Do not import ./globalCss.js!!");
                    return "no CSS";
                }
                fs.writeFileSync(join("src", "globalCss.js"), template(name, css), "utf-8");
                console.log("src/globalCss.js written");
                return "globalCSS.css made";
            } catch (e) {
                log(e);
                log("no globalCss.js made,  some error occurred.");
                return "no globalCss.js made,  some error occurred.";
            }
        }
    }
}

