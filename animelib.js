(function () {
    'use strict';

    if (window.animelib_plugin) return;
    window.animelib_plugin = true;

    var API_BASE = 'https://api.cdnlibs.org/api';

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

        request(API_BASE + '/anime?q=' + encodeURIComponent(title) + '&limit=15', function (json) {
            var list = (json.data || []).map(function (a) {
                return {
                    title: (a.rus_name || a.name) + (a.year ? ' (' + a.year + ')' : ''),
                    id: a.id
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
                    loadEpisodes(item.id, item.title);
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка поиска');
        });
    }

    function loadEpisodes(id, title) {
        Lampa.Noty.show('Загружаю серии...');
        request(API_BASE + '/anime/' + id + '/episodes', function (json) {
            var eps = (json.data || []).map(function (ep) {
                return {
                    title: ep.name || ('Серия ' + ep.number),
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
                    showPlayers(item.episode);
                }
            });
        }, function () {
            Lampa.Noty.show('Ошибка загрузки серий');
        });
    }

    function showPlayers(episode) {
        if (!episode.players || !episode.players.length) {
            Lampa.Noty.show('Нет озвучек');
            return;
        }

        var items = episode.players.map(function (p) {
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
                if (item.player && item.player.link) {
                    Lampa.Player.play({
                        title: episode.name || 'Серия',
                        url: item.player.link,
                        quality: {
                            'HD': item.player.link
                        }
                    });
                } else {
                    Lampa.Noty.show('Нет ссылки');
                }
            }
        });
    }

    // ===== Кнопка (взято из рабочего Z01) =====
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

    // Если карточка уже открыта
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
