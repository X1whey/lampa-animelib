function startSitePlugin() {
    window.site_plugin_ready = true;

    Lampa.Lang.add({
        site_title: {
            ru: 'Сайт',
            en: 'Site'
        }
    });

    function SiteScreen() {
        var html = $('<div class="explorer" style="height:100%;"></div>');
        var head = $('<div style="padding:1em;"></div>');
        var field = $('<input type="text" style="width:70%;padding:0.7em;font-size:1.1em;">');
        var go = $('<div class="simple-button selector" style="display:inline-block;margin-left:0.6em;padding:0.7em 1em;">Открыть</div>');
        var frame = $('<iframe style="width:100%;height:80vh;border:0;background:#fff;" allowfullscreen="true"></iframe>');

        field.val('https://');
        head.append(field).append(go);
        html.append(head).append(frame);

        function open() {
            var url = String(field.val() || '').replace(/^\s+|\s+$/g, '');
            if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) url = 'https://' + url;
            frame.attr('src', url);
        }

        go.on('hover:enter', open);

        this.create = function () { return this.render(); };
        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.collectionFocus(go, html);
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { html.remove(); };
    }

    function init() {
        Lampa.Component.add('site_screen', SiteScreen);

        var btn = $('<li class="menu__item selector"><div class="menu__text">' + Lampa.Lang.translate('site_title') + '</div></li>');

        btn.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: Lampa.Lang.translate('site_title'),
                component: 'site_screen',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(btn);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') init();
    });
}

if (!window.site_plugin_ready) startSitePlugin();
