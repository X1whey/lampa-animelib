(function () {
    'use strict';

    if (window.browser_page_plugin) return;
    window.browser_page_plugin = true;

    var SITE_URL = 'https://rt.pornhub.com';
    var MENU_TITLE = 'Pornhub';

    function openSite() {
        var html = $('<div class="browser-page" style="width:100%;height:100%;background:#000;position:relative;"></div>');
        var iframe = $('<iframe></iframe>');

        iframe.css({
            width: '100%',
            height: '100%',
            border: '0',
            background: '#000'
        });

        iframe.attr({
            src: SITE_URL,
            allowfullscreen: 'true',
            allow: 'autoplay; fullscreen; encrypted-media'
        });

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
    }

    function addMenuItem() {
        // Не добавляем повторно
        if ($('.menu__item[data-action="browser_page"]').length) return;

        var button = $(
            '<li class="menu__item selector" data-action="browser_page">' +
            '<div class="menu__ico">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">' +
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>' +
            '</svg>' +
            '</div>' +
            '<div class="menu__text">' + MENU_TITLE + '</div>' +
            '</li>'
        );

        button.on('hover:enter', function () {
            openSite();
        });

        // Основной список меню (левая панель)
        var list = $('.menu .menu__list').eq(0);
        if (list.length) {
            list.append(button);
        } else {
            // Если меню ещё не готово — подождём
            setTimeout(addMenuItem, 500);
        }
    }

    function init() {
        addMenuItem();

        // На случай, если меню перерисовывается
        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'start' || e.type === 'ready') {
                setTimeout(addMenuItem, 300);
            }
        });
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
