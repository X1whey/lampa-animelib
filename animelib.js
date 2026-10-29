(function () {
    'use strict';

    console.log('[AnimeLib] Загрузка плагина...');

    var API_BASE = 'https://api.cdnlibs.org/api';
    var PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
    ];

    function proxyUrl(url) {
        return PROXIES[0] + encodeURIComponent(url);
    }

    function request(url, success, error) {
        var network = new Lampa.Reguest();
        network.silent(proxyUrl(url), function (data) {
            try {
                if (typeof data === 'string') data = JSON.parse(data);
                success(data);
            } catch (e) {
                if (error) error();
            }
        }, function () {
            network.silent(PROXIES[1] + encodeURIComponent(url), function (data) {
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

    function startSearch(query) {
        if (!query) {
            Lampa.Noty.show('Нет названия');
            return;
        }

        Lampa.Noty.show('Ищу на AnimeLib...');

        request(API_BASE + '/anime?q=' + encodeURIComponent(query) + '&limit=12', function (json) {
            var results = (json.data || []).map(function (item) {
                return {
                    title: (item.rus_name || item.name) + (item.year ? ' (' + item.year + ')' : ''),
                    id: item.id
                };
            });

            if (!results.length) {
                Lampa.Noty.show('Ничего не найдено');
                return;
            }

            Lampa.Select.show({
                title: 'AnimeLib — результаты',
                items: results,
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
            var episodes = (json.data || []).map(function (ep) {
                return {
                    title: ep.name || ('Серия ' + ep.number),
                    episode: ep
                };
            });

            if (!episodes.length) {
                Lampa.Noty.show('Серии не найдены');
                return;
            }

            Lampa.Select.show({
                title: title,
                items: episodes,
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
            Lampa.Noty.show('Нет доступных озвучек');
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
            title: 'Выбор озвучки',
            items: items,
            onSelect: function (item) {
                var p = item.player;
                if (p && p.link) {
                    Lampa.Player.play({
                        title: episode.name || 'Серия',
                        url: p.link,
                        quality: {
                            'HD': p.link
                        }
                    });
                } else {
                    Lampa.Noty.show('Нет ссылки на видео');
                }
            }
        });
    }

    // === Добавляем пункт в меню "ещё" (три точки) ===
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite' || e.type === 'complete') {
            // Добавляем в контекстное меню карточки
            e.object.activity.menu.push({
                title: 'AnimeLib',
                template: 'menu_button',
                onSelect: function () {
                    var movie = e.data.movie;
                    var title = movie.title || movie.name || movie.original_title || '';
                    startSearch(title);
                }
            });
        }
    });

    // Альтернативный способ через событие меню
    Lampa.Listener.follow('menu', function (e) {
        if (e.type === 'open' && e.object && e.object.movie) {
            // Можно добавить сюда тоже
        }
    });

    console.log('[AnimeLib] Плагин загружен');
    Lampa.Noty.show('AnimeLib загружен');

})();
