(function () {
    'use strict';

    if (window.animelib_plugin) return;
    window.animelib_plugin = true;

    var API = 'https://api.cdnlibs.org/api';

    function proxy(url) {
        return 'https://corsproxy.io/?' + encodeURIComponent(url);
    }

    function request(url, success, error) {
        var net = new Lampa.Reguest();
        net.silent(proxy(url), function (data) {
            try {
                if (typeof data === 'string') data = JSON.parse(data);
                success(data);
            } catch (e) {
                if (error) error();
            }
        }, function () {
            net.silent('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), function (data) {
                try {
                    if (typeof data === 'string') data = JSON.parse(data);
                    success(data);
                } catch (e) {
                    if (error) error();
                }
            }, function () {
                if (error) error();
            });
        });
    }

    function startSearch(title) {
        if (!title) {
            Lampa.Noty.show('Нет названия');
            return;
        }

        Lampa.Noty.show('Ищу на AnimeLib...');

        var url = API + '/anime?q=' + encodeURIComponent(title) +
                  '&fields[]=rate&fields[]=rate_avg&fields[]=releaseDate&site_id[]=1&site_id[]=3';

        request(url, function (json) {
            var list = (json.data || []).map(function (a) {
                return {
                    title: (a.rus_name || a.name || a.eng_name || '') + (a.year ? ' (' + a.year + ')' : ''),
                    id: a.slug_url || a.id,
                    slug: a.slug_url
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
                    loadEpisodes(item.slug || item.id, item.title);
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка поиска');
        });
    }

    function loadEpisodes(slug, title) {
        Lampa.Noty.show('Загружаю серии...');

        var url = API + '/episodes?anime_id=' + encodeURIComponent(slug);

        request(url, function (json) {
            var eps = (json.data || []).map(function (ep) {
                return {
                    title: ep.name || ('Серия ' + ep.number),
                    id: ep.id,
                    episode: ep
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

        var url = API + '/episodes/' + episodeId;

        request(url, function (json) {
            var players = (json.data && json.data.players) ? json.data.players : [];

            if (!players.length) {
                Lampa.Noty.show('Нет озвучек');
                return;
            }

            var items = players.map(function (p) {
                var name = (p.team && p.team.name) ? p.team.name : (p.player || 'Озвучка');
                if (p.quality) name += ' [' + p.quality + ']';
                return {
                    title: name,
                    player: p
                };
            });

            Lampa.Select.show({
                title: 'Озвучка',
                items: items,
                onSelect: function (item) {
                    var p = item.player;
                    var link = p.src || p.link || p.url;

                    if (link) {
                        // Kodik обычно начинается с //
                        if (link.indexOf('//') === 0) link = 'https:' + link;

                        Lampa.Player.play({
                            title: title,
                            url: link,
                            quality: {
                                'HD': link
                            }
                        });
                    } else {
                        Lampa.Noty.show('Нет ссылки на видео');
                    }
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка загрузки озвучек');
        });
    }

    // ===== Кнопка (как в Z01) =====
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
