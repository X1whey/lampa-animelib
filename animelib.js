(function () {
    'use strict';

    if (window.browser_page_plugin) return;
    window.browser_page_plugin = true;

    var SITE_URL = 'https://rt.pornhub.com';
    var MENU_TITLE = 'Pornhub';
    var tries = 0;

    function openSite() {
        try {
            var html = $('<div style="width:100%;height:85vh;background:#000;"></div>');
            var iframe = $('<iframe style="width:100%;height:100%;border:0;background:#000;" allowfullscreen="true"></iframe>');
            iframe.attr('src', SITE_URL);
            html.append(iframe);

            Lampa.Modal.open({
                title: MENU_TITLE,
                size: 'full',
                html: html,
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
        } catch (e) {
            if (Lampa && Lampa.Noty) Lampa.Noty.show('Ошибка открытия сайта');
        }
    }

    function addMenuItem() {
        try {
            if (!window.$ || !document.querySelector) return false;
            if ($('.menu__item[data-action="browser_page"]').length) return true;

            var list = $('.menu .menu__list').eq(0);
            if (!list.length) return false;

            var button = $(
                '<li class="menu__item selector" data-action="browser_page">' +
                    '<div class="menu__text">' + MENU_TITLE + '</div>' +
                '</li>'
            );

            button.on('hover:enter', openSite);
            list.append(button);
            return true;
        } catch (e) {
            return false;
        }
    }

    function tryAdd() {
        if (addMenuItem()) return;
        tries++;
        if (tries < 20) setTimeout(tryAdd, 500);
    }

    function init() {
        try {
            tryAdd();
        } catch (e) {}
    }

    function start() {
        if (window.appready) {
            init();
        } else if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') init();
            });
        } else {
            setTimeout(start, 300);
        }
    }

    start();
})();
