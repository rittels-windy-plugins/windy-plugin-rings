<div class="plugin__mobile-header">
    {title}
</div>

<section class="plugin__content">
    <div data-ref="abc">abc</div>
</section>

<script>
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import plugins from '@windy/plugins';

    import config from './pluginConfig';

    import { globalCssNode, insertGlobalCss, removeGlobalCss } from './globalCss.js';

    const { title, name } = config;

    let refs = {};

    export const onopen = _params => {
    };

    onMount(() => {
        insertGlobalCss();
    });

    onDestroy(() => {
        removeGlobalCss();
    });

    plugins[name].exports = {
    };
</script>


<style lang="less">
    @import 'no-ex.less?1709472465099';
</style>
