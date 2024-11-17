<div class="embed-window">
    <span
        class="checkbox"
        class:checkbox--off={!thisPlugin.isFocused}
        style="position:relative; top:0.1em"
        data-tooltip={`Picker focuses on the ${title} plugin.`}
        on:click={focus}>&nbsp;</span
    >
    <span
        on:click={() => {
            showInfo(name);
            focus(); // not sure,  but seems to make sense intuitively
        }}
        style:cursor="pointer">Show rings settings</span
    >
    <div data-ref="messageDiv" class="hidden"></div>
</div>

<div bind:this={mainDiv} id={`${name}-info`} class="bg-transparent dark-content">
    <div
        class="closing-x"
        on:click={() => {
            document.body.classList.remove(`on${name}-info`);
        }}
    ></div>
    <div bind:this={cornerHandle} data-ref="cornerHandle" class="corner-handle"></div>
    <div bind:this={cornerHandleTop} data-ref="cornerHandleTop" class="corner-handle-top"></div>

    <div class="scrollable">
        <div class="plugin__title">Rings</div>
        <div>
            {#each rs as { radius: r }, ix}
                <div
                    class="ring-line checkbox"
                    class:checkbox--off={ix !== selected}
                    on:click={() => {
                        selected = ix;
                        rVal = rad2rVal(rings[selected].radius);
                    }}
                >
                    {format(r)}
                    <span
                        class="closing-x"
                        on:click={() => {
                            removeRing(rings[ix]);
                            rings.splice(ix, 1);
                            rs = rings;
                            if (selected >= rings.length) selected = rings.length - 1;
                        }}
                    ></span>
                </div>
            {/each}
        </div>
        <br />

        <button
            class="button"
            on:click={() => {
                selected =
                    rings.push({ radius: rings.length ? rings.slice(-1)[0].radius + iVal : iVal }) -
                    1;
                rVal = rad2rVal(rings[selected].radius);
                rs = rings;
                updateRings();
            }}
        >
            Add Ring
        </button>

        <div>
            <label for="radius-range">Radius: {format(rangeVals[rVal])} </label>
            <input
                name="radius-range"
                min="0"
                max="250"
                type="range"
                bind:value={rVal}
                on:input={() => {
                    rings[selected].radius = rangeVals[rVal];
                    rs = rings;
                    updateRadius();
                }}
            />
        </div>
        <div>
            <label for="inc-range">Next ring: {format(iVal)}</label>
            <input
                name="inc-range"
                min="0"
                max="125000"
                step="500"
                type="range"
                bind:value={iVal}
            />
        </div>
        <div
            class="checkbox"
            class:checkbox--off={!vincenty}
            on:click={() => (vincenty = !vincenty)}
        >
            Vincenty
        </div>
        <br /><br />
        <div class="mb-5">Show picker coordinates and ring bounds in:</div>
        <select bind:value={showCoords}>
            {#each showCoordsAr as c}
                <option value={c}>{c}</option>
            {/each}
        </select>
        <br /><br />
        <div>
            <div data-ref="pickerPos"></div>
        </div>
    </div>
</div>

<script lang="ts">
    // @ts-nocheck

    import { onDestroy, onMount } from 'svelte';

    import bcast from '@windy/broadcast';
    import plugins from '@windy/plugins';
    import store from '@windy/store';
    import { isTablet } from '@windy/rootScope';

    import { init, closeCompletely } from './rings_main.js';
    import {
        addDrag,
        showInfo,
        getWrapDiv,
        makeBottomRightHandle,
        makeTopLeftHandle,
        embedForTablet,
    } from './utils/infoWinUtils.js';
    import { getPickerMarker } from './picker/picker.js';

    import config from './pluginConfig';
    const { title, name } = config;

    const thisPlugin = plugins[name];
    let node;
    let mainDiv;
    let cornerHandle, cornerHandleTop;
    let closeButtonClicked;
    let marker;

    function focus() {
        for (let p in plugins) {
            if (p.includes('windy-plugin') && p !== name && plugins[p].defocus) {
                plugins[p].defocus();
            }
        }
        thisPlugin.isFocused = true;

        // now do whatever,  for this plugin,  only addRightPlugin and addLeftPlugin ;
        marker = getPickerMarker();

        let coordsPlace = store.get('windy-plugin-rings-show-coords');
        if (coordsPlace == 'Picker Right') marker?.addRightPlugin(name);
        if (coordsPlace == 'Picker Left') marker?.addLeftPlugin(name);
        if (marker?.getParams()) {
            marker.openMarker(marker.getParams());
        }
    }

    function defocus() {
        thisPlugin.isFocused = false;
    }

    onMount(() => {
        init(thisPlugin);
        node = thisPlugin.window.node;

        const wrapDiv = getWrapDiv();
        wrapDiv.appendChild(mainDiv);

        makeBottomRightHandle(cornerHandle, mainDiv);
        makeTopLeftHandle(cornerHandleTop, mainDiv);

        //// this should not be needed later
        node.querySelector(':scope > .closing-x').addEventListener(
            'click',
            () => (closeButtonClicked = true),
        );

        //// should also not be needed later,  fix for tablet
        // change embed to small if tablet
        embedForTablet(thisPlugin);
        //

        focus();
        thisPlugin.focus = focus;
        thisPlugin.defocus = defocus;

        rs = rings;
    });

    export const onopen = _params => {};

    onDestroy(() => {
        mainDiv.remove();
        document.body.classList.remove(`on${name}-info`);

        ////  this should not be needed later,   whole plugin can then be moved into svelte.  thisPlugin.open()  requires an object
        if (!closeButtonClicked) setTimeout(() => thisPlugin.open({}));
        else closeCompletely();
        ////
    });

    import {
        rings,
        vars,
        updateRings,
        updateRadius,
        removeRing,
        switchCoordsDiv,
        showCoordsAr,
    } from './rings_main.js';

    let rangeVals = [];
    for (let i = 0, step = 100, v = 100; i <= 300; i++) {
        rangeVals.push(v);
        v += step;
        if (v == 1000) step = 200;
        else if (v == 5000) step = 500;
        else if (v == 10000) step = 1000;
        else if (v == 50000) step = 2000;
        else if (v == 100000) step = 5000;
        else if (v == 250000) step = 10000;
        else if (v == 500000) step = 100000;
    }

    let rs = [],
        selected = rings.length - 1,
        rVal = rad2rVal(rings[selected].radius);

    let { iVal, vincenty, showCoords } = vars;

    function rad2rVal(rad) {
        return rangeVals.findIndex(r => r >= rad);
    }
    function format(r) {
        return r > 1000 ? `${r / 1000} km` : `${r} m`;
    }

    $: vars.iVal = iVal;
    $: {
        vars.vincenty = vincenty;
        updateRings();
    }
    $: {
        vars.showCoords = showCoords;
        switchCoordsDiv(showCoords);
    }
</script>

<style lang="less">
    @import 'rings.less?1731861661685';
</style>
