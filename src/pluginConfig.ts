import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-rings',
    version: '0.2.12',
    icon: '⭕',
    title: 'Rings    ',
    description: 'Show range rings around the picker.',
    author: 'Rittels',
    repository: 'https://www.github.com/rittels-windy-plugins/windy-plugin-rings.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    routerPath: '/rings/:lat?/:lon?/:time?',
};

export default config;
