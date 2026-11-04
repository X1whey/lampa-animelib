(function () {
    'use strict';

    if (window.site_open_plugin) return;
    window.site_open_plugin = true;

    var KEY = 'site_open_last_url';

    function normalize(url) {
        url = String(url || '').replace(/^\s+|\s+$/g, '');
        if (!url) return '';
        if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) url = 'https://' + url;
        return url;
    }

    function openUrl(url) {
        var html = $('<div style="width:100%;height:85vh;background:#000;"></div>');
        var frame = $('<iframe style="width:100%;height:100%;border:0;background:#fff;" allowfullscreen="true"></iframe>');
        frame.attr('src', url);
        html.append(frame);

        Lampa.Modal.open({
            title: 'Сайт',
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

        var box = $('<div style="padding:1em;"></div>');
        var field = $('<input type="text" class="simple-keyboard-input" style="width:100%;padding:0.8em;font-size:1.1em;border-radius:0.4em;border:0;">');
        field.val(last || 'https://');
        box.append(field);

        Lampa.Modal.open({
            title: 'Ссылка',
            size: 'medium',
            html: box,
            buttons: [
                {
                    name: 'Открыть',
                    onSelect: function () {
                        var url = normalize(field.val());
                        Lampa.Modal.close();
                        if (!url) {
                            Lampa.Noty.show('Введите ссылку');
                            Lampa.Controller.toggle('menu');
                            return;
                        }
                        try { Lampa.Storage.set(KEY, url); } catch (e) {}
                        openUrl(url);
                    }
                }
            ],
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });

        setTimeout(function () { field.focus(); }, 300);
    }

    function addMenuItem() {
        if ($('.menu__item[data-action="site_open"]').length) return true;
        var list = $('.menu .menu__list').eq(0);
        if (!list.length) return false;

        var button = $('<li class="menu__item selector" data-action="site_open"><div class="menu__text">Сайт</div></li>');
        button.on('hover:enter', askUrl);
        list.append(button);
        return true;
    }

    var tries = 0;
    function tryAdd() {
        try {
            if (addMenuItem()) return;
        } catch (e) {}
        tries++;
        if (tries < 40) setTimeout(tryAdd, 400);
    }

    function init() {
        tryAdd();
        if (window.Lampa && Lampa.Noty) Lampa.Noty.show('Плагин Сайт включён');
    }

    if (window.appready) init();
    else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
