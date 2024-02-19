import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

import serve from 'rollup-plugin-serve';
import rollupSvelte from 'rollup-plugin-svelte';
import rollupSwc from 'rollup-plugin-swc3';
import rollupCleanup from 'rollup-plugin-cleanup';
import chokidar from 'chokidar';
import puppeteer from 'puppeteer';

import { less } from 'svelte-preprocess-less';
import sveltePreprocess from 'svelte-preprocess';

import { transformCodeToESMPlugin, keyPEM, certificatePEM } from '@windycom/plugin-devtools';

const useSourceMaps = true;

const buildConfigurations = {
    src: {
        input: 'src/plugin.svelte',
        out: 'plugin',
    },
    example01: {
        input: 'examples/01-hello-world/plugin.svelte',
        out: 'example01/plugin',
    },
    example02: {
        input: 'examples/02-using-vanilla-js/plugin.svelte',
        out: 'example02/plugin',
    },
    example03: {
        input: 'examples/03-boat-tracker/plugin.svelte',
        out: 'example03/plugin',
    },
    example04: {
        input: 'examples/04-aircraft-range/plugin.svelte',
        out: 'example04/plugin',
    },
    example05: {
        input: 'examples/05-airspace-map/plugin.svelte',
        out: 'example05/plugin',
    },
    example06: {
        input: 'examples/06-foehn-chart/plugin.svelte',
        out: 'example06/plugin',
    },
};

const requiredConfig = process.env.CONFIG || 'src';
const { input, out } = buildConfigurations[requiredConfig];

export default {
    input,
    output: [
        {
            file: `dist/${out}.js`,
            format: 'module',
            sourcemap: true,
        },
        {
            file: `dist/${out}.min.js`,
            format: 'module',
            plugins: [rollupCleanup({ comments: 'none', extensions: ['ts'] }), terser()],
        },
    ],

    onwarn: () => {
        /* We disable all warning messages */
    },
    external: id => id.startsWith('@windy/'),
    watch: {
        include: ['src/**', 'examples/**'],
        exclude: 'node_modules/**',
        clearScreen: false,
    },
    plugins: [
        typescript({
            sourceMap: useSourceMaps,
            inlineSources: false,
        }),
        rollupSwc({
            include: ['**/*.ts', '**/*.svelte'],
            sourceMaps: useSourceMaps,
        }),
        rollupSvelte({
            emitCss: false,
            preprocess: {
                style: less({
                    sourceMap: false,
                    math: 'always',
                }),
                script: data => {
                    const preprocessed = sveltePreprocess({ sourceMap: useSourceMaps });
                    return preprocessed.script(data);
                },
            },
        }),

        resolve({
            browser: true,
            mainFields: ['module', 'jsnext:main', 'main'],
            preferBuiltins: false,
            dedupe: ['svelte'],
        }),
        commonjs(),
        transformCodeToESMPlugin(),
        process.env.SERVE !== 'false' &&
            serve({
                contentBase: 'dist',
                host: 'localhost',
                port: 9999,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                https: {
                    key: keyPEM,
                    cert: certificatePEM,
                },
            }),
    ],
};


(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({headless:false, args: ['--no-sandbox']});
    const page = await browser.newPage();
  
    await page.setViewport({width: 1080, height: 1024});
    // Navigate the page to a URL
    await page.goto('https://client-index-ivo-esm.dev.windy.com/developer-mode');
  
    // Set screen size
    await page.setViewport({width: 1080, height: 1024});
  
    // Type into search box
   // await page.type('.devsite-search-field', 'automate beyond recorder');
  
    // Wait and click on first result
    //const searchResultSelector = '.devsite-result-item-link';
    //await page.waitForSelector(searchResultSelector);
    //await page.click(searchResultSelector);
  
    // Locate the full title with a unique string
    //const textSelector = await page.waitForSelector(
    //  'text/Customize and automate'
    //);
    //const fullTitle = await textSelector?.evaluate(el => el.textContent);
  
    // Print the full title
    //console.log('The title of this blog post is "%s".', fullTitle);
    setTimeout(()=> browser.close(),  10000);
  })();


const watcher = chokidar.watch('dist/**');
watcher.on("change",()=>{
    console.log("dist has changed,  reload browser");
    

});

