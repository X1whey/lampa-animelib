(function () {
    'use strict';

    if (window.animelib_plugin) return;
    window.animelib_plugin = true;

    var API = 'https://api.cdnlibs.org/api';

    var PROXIES = [
        function(url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); },
        function(url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
        function(url) { return 'https://cors.eu.org/' + url; },
        function(url) { return url; } // прямой запрос (на случай если Lampa сама проксирует)
    ];

    function request(url, success, error) {
        var net = new Lampa.Reguest();
        var index = 0;

        function tryNext() {
            if (index >= PROXIES.length) {
                if (error) error();
                return;
            }

            var fullUrl = PROXIES[index](url);
            index++;

            net.silent(fullUrl, function (data) {
                try {
                    if (typeof data === 'string') {
                        // иногда allorigins возвращает обёртку
                        if (data.indexOf('"contents"') > -1) {
                            var parsed = JSON.parse(data);
                            data = parsed.contents || data;
                        }
                        data = JSON.parse(data);
                    }
                    success(data);
                } catch (e) {
                    tryNext();
                }
            }, function () {
                tryNext();
            });
        }

        tryNext();
    }

    function startSearch(title) {
        if (!title) {
            Lampa.Noty.show('Нет названия');
            return;
        }

        Lampa.Noty.show('Ищу: ' + title);

        var url = API + '/anime?q=' + encodeURIComponent(title) +
                  '&fields[]=rate&fields[]=rate_avg&fields[]=releaseDate&site_id[]=1&site_id[]=3';

        request(url, function (json) {
            var list = (json.data || []).map(function (a) {
                return {
                    title: (a.rus_name || a.name || a.eng_name || '') + (a.releaseDate ? ' (' + a.releaseDate.substring(0,4) + ')' : ''),
                    slug: a.slug_url || a.id
                };
            });

            if (!list.length) {
                Lampa.Noty.show('Ничего не найдено');
                return;
            }

            Lampa.Select.show({
                title: 'AnimeLib',
                items: list,
                onSelect: function (item) {
                    loadEpisodes(item.slug, item.title);
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка поиска (прокси/сеть)');
        });
    }

    function loadEpisodes(slug, title) {
        Lampa.Noty.show('Загружаю серии...');

        request(API + '/episodes?anime_id=' + encodeURIComponent(slug), function (json) {
            var eps = (json.data || []).map(function (ep) {
                return {
                    title: 'Серия ' + ep.number + (ep.name ? ' — ' + ep.name : ''),
                    id: ep.id
                };
            });

            if (!eps.length) {
                Lampa.Noty.show('Серии не найдены');
                return;
            }

            Lampa.Select.show({
                title: title,
                items: eps,
                onSelect: function (item) {
                    loadPlayers(item.id, item.title);
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка загрузки серий');
        });
    }

    function loadPlayers(episodeId, title) {
        Lampa.Noty.show('Загружаю озвучки...');

        request(API + '/episodes/' + episodeId, function (json) {
            var players = (json.data && json.data.players) ? json.data.players : [];

            if (!players.length) {
                Lampa.Noty.show('Нет озвучек');
                return;
            }

            var items = players.map(function (p) {
                var name = (p.team && p.team.name) ? p.team.name : (p.player || 'Озвучка');
                return {
                    title: name,
                    src: p.src
                };
            });

            Lampa.Select.show({
                title: 'Озвучка',
                items: items,
                onSelect: function (item) {
                    var link = item.src;
                    if (!link) {
                        Lampa.Noty.show('Нет ссылки');
                        return;
                    }
                    if (link.indexOf('//') === 0) link = 'https:' + link;

                    Lampa.Player.play({
                        title: title,
                        url: link,
                        quality: { '720p': link }
                    });
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка загрузки озвучек');
        });
    }

    // ===== Кнопка =====
    var buttonHtml = '<div class="full-start__button selector view--animelib" style="background:linear-gradient(45deg,#7b5cff,#c44dff)">' +
        '<span>AnimeLib</span></div>';

    function addButton(data) {
        if (!data || !data.render || !data.render.length) return;
        if (data.render.parent().find('.view--animelib').length) return;

        var btn = $(buttonHtml);
        btn.on('hover:enter', function () {
            var movie = data.movie || {};
            var title = movie.title || movie.name || movie.original_title || '';
            startSearch(title);
        });
        data.render.after(btn);
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            addButton({
                render: e.object.activity.render().find('.view--torrent'),
                movie: e.data.movie
            });
        }
    });

    try {
        if (Lampa.Activity.active().component == 'full') {
            addButton({
                render: Lampa.Activity.active().activity.render().find('.view--torrent'),
                movie: Lampa.Activity.active().card
            });
        }
    } catch (e) {}

    Lampa.Noty.show('AnimeLib загружен');
})();
