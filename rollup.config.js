import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

import serve from 'rollup-plugin-serve';
import rollupSvelte from 'rollup-plugin-svelte';
import rollupSwc from 'rollup-plugin-swc3';
import rollupCleanup from 'rollup-plugin-cleanup';
//import chokidar from 'chokidar';
//import puppeteer from 'puppeteer';
//import livereload from 'rollup-plugin-livereload';

import { less } from 'svelte-preprocess-less';
import sveltePreprocess from 'svelte-preprocess';

import * as tsImport from 'ts-import';

import { makeGlobalCss } from './globalCss.js';

import { transformCodeToESMPlugin, keyPEM, certificatePEM } from '@windycom/plugin-devtools';

const useSourceMaps = true;

const config = (await tsImport.load('./src/pluginConfig.ts')).default;
const { name } = config;
const fileName = name.match(/windy-plugin-(.*)/)[1];

const buildConfigurations = {
    src: {
        input: `src/${fileName}.svelte`,
        out: 'plugin',
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
        exclude: ['src/globalCss.js','node_modules/**'],
        clearScreen: false,
        
    },

    plugins: [
        makeGlobalCss(),
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
        /*
        livereload({
            watch: 'dist',
            verbose: true,
            delay:5000,
            clientHostname: "https://www.google.com"
          
           
          }),
          */
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

/*

const watcher = chokidar.watch('dist/**');
watcher.on("change",()=>{
    console.log("dist has changed,  reload browser");
    

});

*/

