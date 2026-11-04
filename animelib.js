(function () {
    'use strict';

    function startPlugin() {
        window.plugin_site_ready = true;

        function openSite(url) {
            var html = $('<div></div>');
            var frame = $('<iframe style="width:100%;height:28em;border:0;background:#fff;" allowfullscreen="true"></iframe>');
            html.append(frame);
            frame.attr('src', url);
            Lampa.Modal.open({
                title: 'Сайт',
                size: 'large',
                html: html,
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('menu');
                }
            });
        }

        function add() {
            var button = $('<li class="menu__item selector"><div class="menu__text">Сайт</div></li>');

            button.on('hover:enter', function () {
                var last = Lampa.Storage.get('site_open_url', 'https://');
                Lampa.Input.edit({
                    title: 'Ссылка',
                    value: last,
                    free: true,
                    nosave: true
                }, function (value) {
                    var url = (value || '').trim();
                    if (!url) return;
                    if (url.indexOf('http') !== 0) url = 'https://' + url;
                    Lampa.Storage.set('site_open_url', url);
                    openSite(url);
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) add();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') add();
            });
        }
    }

    if (!window.plugin_site_ready) startPlugin();
})();
