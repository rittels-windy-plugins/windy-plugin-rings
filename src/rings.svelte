<div class="plugin__mobile-header">
    {title}
</div>

<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        Rings
    </div>
    <div class="closing-x" on:click={closeCompletely}></div>

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
                rings.push({ radius: rings.length ? rings.slice(-1)[0].radius + iVal : iVal }) - 1;
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
        <input name="inc-range" min="0" max="125000" step="500" type="range" bind:value={iVal} />
    </div>
    <div
        class="checkbox"
        class:checkbox--off={!vincenty}
        on:click={() => {
            vincenty = !vincenty;
            updateRings();
        }}
    >
        Vincenty
    </div>
    <br /><br />
    <div class="mb-5">Show picker coordinates and ring bounds in:</div>
    <select
        bind:value={showCoords}
        on:change={() => {
            switchCoordsDiv(showCoords);
        }}
    >
        {#each showCoordsAr as c}
            <option value={c}>{c}</option>
        {/each}
    </select>
    <br /><br />
    <div>
        <div data-ref="pickerPos"></div>
    </div>
</section>

<script lang="ts">
    // @ts-nocheck

    import { onDestroy, onMount } from 'svelte';

    import bcast from '@windy/broadcast';
    import plugins from '@windy/plugins';

    import { init, closeCompletely } from './rings_main.js';

    import config from './pluginConfig';

    const { title, name } = config;

    const thisPlugin = plugins[name]; 

    onMount(() => {
        rs = rings;
        init(thisPlugin);
    });

    export const onopen = _params => {};

    onDestroy(() => {});

    ///// boiler plate ends here

    import { rings, vars, updateRings, updateRadius, removeRing, switchCoordsDiv, showCoordsAr } from './rings_main.js';

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
    $: vars.vincenty = vincenty;
    $: vars.showCoords = showCoords;
</script>

<style lang="less">
    @import 'rings.less?1712939030893';
</style>
