(function () {
    'use strict';

    if (window.site_open_plugin) return;
    window.site_open_plugin = true;

    var KEY = 'site_open_last_url';

    function normalize(url) {
        url = (url || '').trim();
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
    }

    function openUrl(url) {
        var html = $('<div style="width:100%;height:85vh;background:#000;"></div>');
        var iframe = $('<iframe style="width:100%;height:100%;border:0;background:#fff;" allowfullscreen="true"></iframe>');
        iframe.attr('src', url);
        html.append(iframe);

        Lampa.Modal.open({
            title: url,
            size: 'full',
            html: html,
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });
    }

    function askUrl() {
        var last = '';
        try { last = Lampa.Storage.get(KEY, '') || ''; } catch (e) {}

        Lampa.Input.edit({
            title: 'Ссылка на сайт',
            value: last,
            free: true,
            nosave: true
        }, function (value) {
            var url = normalize(value);
            if (!url) {
                Lampa.Noty.show('Введите ссылку');
                Lampa.Controller.toggle('menu');
                return;
            }
            try { Lampa.Storage.set(KEY, url); } catch (e) {}
            openUrl(url);
        });
    }

    function addMenuItem() {
        if ($('.menu__item[data-action="site_open"]').length) return true;

        var list = $('.menu .menu__list').eq(0);
        if (!list.length) return false;

        var button = $(
            '<li class="menu__item selector" data-action="site_open">' +
                '<div class="menu__text">Сайт</div>' +
            '</li>'
        );

        button.on('hover:enter', function () {
            askUrl();
        });

        list.append(button);
        return true;
    }

    var tries = 0;
    function tryAdd() {
        if (addMenuItem()) return;
        tries++;
        if (tries < 30) setTimeout(tryAdd, 400);
    }

    function init() {
        tryAdd();
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
