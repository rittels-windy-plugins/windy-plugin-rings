//#!/usr/bin/env node

// I am sure there is a better way to do this,  but this works for me.  
// changes in the less file imported in to the .svelte file,  does not trigger the rebuild.
// changing the path of @import in the less tag,  works.  

import fs from 'fs';
import * as tsImport from 'ts-import';
let { log } = console;

export const rebuildOnLessChange = function () {
    return {
        name: "rebuild-on-less-change",
        async buildStart() {
            const config = (await tsImport.load('./src/pluginConfig.ts')).default;
            const name = config.name.match(/windy-plugin-(.*)/)[1];
            const lessFile = `src/${name}.svelte`;
            let content = fs.readFileSync(lessFile, "utf-8");
            let old = new RegExp(`${name}.less\\?(\\d*)`);
            
            let mtch = content.match(old);
            if(mtch && (Date.now() - mtch[1])>3000 ){
                let nw = `${name}.less?${Date.now()}`;
                content=content.replace(old,nw);
                fs.writeFileSync(lessFile, content, "utf-8");
                log("imported less file name changed from", mtch[0], "to", nw, "to force rebuild to include less changes");
            }
        }
    }
}

