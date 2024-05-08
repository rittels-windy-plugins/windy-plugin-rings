import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-rings',
    version: '0.2.4',
    icon: '⭕',
    title: 'Rings    ',
    description: 'Show range rings around the picker.',
    author: 'Rittels',
    repository: 'github.com/rittels-windy-plugins/windy-plugin-rings.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true
    //routerPath: '/my-plugin',
};

export default config;
