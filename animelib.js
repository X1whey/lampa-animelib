function startSitePlugin() {
    window.site_plugin_ready = true;

    function openAsk() {
        var last = '';
        try { last = Lampa.Storage.get('site_open_url', '') || ''; } catch (e) {}

        Lampa.Input.edit({
            title: 'Ссылка',
            value: last || 'https://',
            free: true,
            nosave: true
        }, function (value) {
            var url = String(value || '').replace(/^\s+|\s+$/g, '');
            if (!url) return;
            if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) url = 'https://' + url;
            try { Lampa.Storage.set('site_open_url', url); } catch (e) {}

            var html = $('<div style="width:100%;height:85vh;background:#000;"></div>');
            var frame = $('<iframe style="width:100%;height:100%;border:0;background:#fff;" allowfullscreen="true"></iframe>');
            frame.attr('src', url);
            html.append(frame);

            Lampa.Modal.open({
                title: 'Сайт',
                size: 'large',
                html: html,
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
        });
    }

    function addButton() {
        if ($('.menu__item[data-action="site_open"]').length) return $('.menu .menu__list').length;

        var lists = $('.menu .menu__list');
        if (!lists.length) return 0;

        var btn = $('<li class="menu__item selector" data-action="site_open"><div class="menu__text">Сайт</div></li>');
        btn.on('hover:enter', openAsk);
        lists.eq(0).append(btn);
        return lists.length;
    }

    function init() {
        var n = 0;
        var t = setInterval(function () {
            n++;
            var found = addButton();
            if ($('.menu__item[data-action="site_open"]').length || n > 20) {
                clearInterval(t);
                Lampa.Noty.show(found ? 'Сайт добавлен в меню' : 'Меню не найдено');
            }
        }, 500);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') init();
    });
}

if (!window.site_plugin_ready) startSitePlugin();
