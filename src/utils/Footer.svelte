<div class="plugin__footer" class:narrow={infoWinWidth < 200} class:footerClosed={!footerOpen}>
    <div
        class="button menu-button"
        on:click={() => {
            footerOpen = !footerOpen;
            onFooterClick(footerOpen);
        }}
    >
        {#if footerOpen}&#10006;
        {:else}&#9776;{/if}
    </div>
    <div class="rows" class:footerClosed={!footerOpen}>
        {#if topRow}
            <div class="top-row">{@html topRow}</div>
        {/if}
        <div class="bottom-row">
            <div class:hidden={infoWinWidth < 360}>
                {infoWinWidth < 500 ? 'version' : config.name}
                {config.version}
                {infoWinWidth < 400 ? '' : ' by ' + config.author}
            </div>
            <a
                class="button"
                class:hidden={hideCoffee}
                href="https://buymeacoffee.com/rittels"
                target="_blank"
            >
                <svg
                    height="13"
                    stroke="white"
                    fill="rgba(255,221,0,0.3)"
                    viewBox="0 0 32 32"
                    width="13"
                    xmlns="http://www.w3.org/2000/svg"
                    ><path
                        d="m9.197 0-1.619 3.735h-2.407v3.359h.921l.943 5.975h-1.473l1.948 10.973 1.249-.015 1.256 7.973h11.891l.083-.531 1.172-7.443 1.188.015 1.943-10.973h-1.407l.937-5.975h1.011v-3.359h-2.557l-1.625-3.735zm.704 1.073h12.057l1.025 2.375h-14.115zm-3.666 3.73h19.525v1.228h-19.525zm.604 9.333h18.183l-1.568 8.823-7.536-.079-7.511.079z"
                    /></svg
                >
                <!-- from:  https://iconduck.com/icons/10899/buy-me-a-coffee,  Url=https://iconduck.com/vectors/vctr9n3b7nxh/media/svg/download -->
                {#if infoWinWidth > 285}
                    &nbsp;Buy me a Coffee!
                {/if}
            </a>
            <a
                class="button"
                href={'https://rittels-windy-plugins.github.io' + infoRouter}
                target="_blank">{infoWinWidth > 285 ? 'Info' : 'i'}</a
            >
            <div class="button" on:click={() => (isFullscreen = toggleFullscreen())}>
                {#if isFullscreen}
                    <span data-icon=""></span>
                {:else}
                    <span data-icon=""></span>
                {/if}
            </div>
            <div
                class="button"
                on:click={() => {
                    bcast.fire('rqstOpen', 'external-plugins');
                    if (rs.isMobileOrTablet){
                        // rather close the infowindow if plugin gallery is opened,  else becomes confusing,  when you open something else,  and it is still here.
                        document.body.classList.remove(`on${config.name}-info`);
                    }
                }}
            >
                <span data-icon=""></span>
                {#if infoWinWidth > 285}
                    &nbsp;Plugins{/if}
            </div>
        </div>
    </div>
</div>

<script lang="ts">
    // @ts-nocheck
    import  rs from '@windy/rootScope';

    const { log } = console;
    import { onDestroy, onMount } from 'svelte';
    import bcast from '@windy/broadcast';
    import config from '../pluginConfig.js';
    import { toggleFullscreen } from './infoWinUtils.js';
    import { rtrnSelf } from '@windy/client/Metric.js';
    import { isMobileOrTablet } from '@windy/client/rootScope.js';
    let infoWinWidth, isFullscreen;
    let footerOpen = true;
    let hideCoffee = false;
    export let onFooterClick = () => {};
    export let topRow;

    let infoRouter = config.routerPath && config.routerPath.match(/\/([^\/]*)/);

    infoRouter = infoRouter ? '?' + infoRouter[1] : '';

    function onWinWidth(e) {
        if (config.name != e.name) return;
        infoWinWidth = e.width;
    }

    onMount(() => {
        bcast.on('infoWinOpened', onWinWidth);
        bcast.on('infoWinResized', onWinWidth);
    });

    onDestroy(() => {
        bcast.off('infoWinOpened', onWinWidth);
        bcast.off('infoWinResized', onWinWidth);
    });
</script>

<style type="less">
    .plugin__footer {
        position: relative;
        width: calc(100%-0.1em);
        font-size: 0.8em;
        color: rgba(220, 220, 210);
        border-top: 1px solid rgba(220, 220, 210, 0.3);

        .bottom-row {
            width: calc(100% - 20px);
            left: 20px;
            position: relative;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: space-between;

            padding: 0.2em 0.3em 0 0;

            a,
            div {
                margin: 0.1em 0.2em 0.1em 0.2em;
                padding: 0.1em 0.5em;
                border-radius: 0.8em;
                text-align: center;
                align-items: center;
                flex-grow: 5;
            }
        }

        .top-row {
            position: relative;
            width: 100%;
        }

        .button {
            background-color: rgba(0, 0, 0, 0.2);
            min-width: 4em;
            flex-grow: 1;
            color: rgba(220, 220, 210);
            &.menu-button {
                background-color: rgba(0, 0, 0, 0);
                min-width: auto;
                max-width: 1em;
                position: absolute;
                bottom: -2px;
                left: -5px;
                padding: 1px;
            }
        }

        &.footerClosed {
            border-top: 0px;
            .rows {
                display: none;
            }
        }
    }
    // narrow not availble on initiation
    :global(.narrow) {
        flex-wrap: wrap;
        .button {
            min-width: auto;
            margin-left: 0.05em;
            margin-right: 0.05em;
        }
    }
</style>
