(function () {
    'use strict';

    if (window.pornhub_lampa_plugin) return;
    window.pornhub_lampa_plugin = true;

    function openPornhub() {
        let html = $('<div style="width:100%;height:100%;background:#000;"></div>');
        let iframe = $('<iframe style="width:100%;height:100%;border:0;" allowfullscreen allow="autoplay; fullscreen"></iframe>');
        
        iframe.attr('src', 'https://rt.pornhub.com');
        html.append(iframe);

        Lampa.Modal.open({
            title: '',
            size: 'full',
            html: html,
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });
    }

    function addMenuItem() {
        Lampa.Menu.add({
            title: 'Pornhub',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>',
            onSelect: function () {
                openPornhub();
            }
        });
    }

    function start() {
        if (window.appready) {
            addMenuItem();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    addMenuItem();
                }
            });
        }
    }

    start();
})();
