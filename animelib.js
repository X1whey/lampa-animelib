(function () {
    'use strict';

    var SOURCE_NAME = 'AnimeLib';
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
        var fullUrl = proxyUrl(url);

        network.silent(fullUrl, function (data) {
            try {
                if (typeof data === 'string') data = JSON.parse(data);
                success(data);
            } catch (e) {
                if (error) error(e);
                else Lampa.Noty.show('Ошибка разбора ответа');
            }
        }, function () {
            // Второй прокси
            var altUrl = PROXIES[1] + encodeURIComponent(url);
            network.silent(altUrl, function (data) {
                try {
                    if (typeof data === 'string') data = JSON.parse(data);
                    success(data);
                } catch (e) {
                    if (error) error(e);
                    else Lampa.Noty.show('Ошибка разбора ответа');
                }
            }, function () {
                if (error) error();
                else Lampa.Noty.show('Не удалось получить данные');
            });
        });
    }

    function notify(text) {
        Lampa.Noty.show(text);
    }

    function searchAnime(query, callback) {
        var url = API_BASE + '/anime?q=' + encodeURIComponent(query) + '&limit=15';
        request(url, function (json) {
            var results = (json.data || []).map(function (item) {
                return {
                    id: item.id,
                    title: item.rus_name || item.name,
                    year: item.year,
                    poster: (item.image && item.image.preview) ? item.image.preview : ''
                };
            });
            callback(results);
        }, function () {
            notify('Ошибка поиска');
            callback([]);
        });
    }

    function getEpisodes(animeId, callback) {
        var url = API_BASE + '/anime/' + animeId + '/episodes';
        request(url, function (json) {
            var episodes = (json.data || []).map(function (ep) {
                return {
                    id: ep.id,
                    number: ep.number,
                    name: ep.name || ('Серия ' + ep.number),
                    players: ep.players || []
                };
            });
            callback(episodes);
        }, function () {
            notify('Не удалось загрузить серии');
            callback([]);
        });
    }

    function extractStream(player, callback) {
        if (!player || !player.link) {
            callback(null);
            return;
        }

        if (player.player === 'Animelib' || player.player === 'animelib') {
            callback({
                url: player.link,
                quality: player.quality || 'HD',
                title: (player.team && player.team.name) ? player.team.name : 'AnimeLib'
            });
            return;
        }

        // Для остальных просто отдаём ссылку
        callback({
            url: player.link,
            quality: player.quality || 'HD',
            title: player.player || 'Stream'
        });
    }

    function showVoicesAndPlay(episode) {
        if (!episode.players || !episode.players.length) {
            notify('Нет доступных озвучек');
            return;
        }

        var items = episode.players.map(function (p) {
            var team = (p.team && p.team.name) ? p.team.name : (p.player || 'Озвучка');
            var quality = p.quality ? ' [' + p.quality + ']' : '';
            return {
                title: team + quality,
                player: p
            };
        });

        Lampa.Select.show({
            title: 'Выбор озвучки',
            items: items,
            onSelect: function (item) {
                Lampa.Noty.show('Получаю ссылку...');
                extractStream(item.player, function (stream) {
                    if (!stream || !stream.url) {
                        notify('Не удалось получить ссылку');
                        return;
                    }

                    Lampa.Player.play({
                        title: episode.name,
                        url: stream.url,
                        quality: {
                            [stream.quality || 'HD']: stream.url
                        }
                    });
                });
            },
            onBack: function () {
                Lampa.Controller.toggle('select');
            }
        });
    }

    function showEpisodes(anime) {
        Lampa.Noty.show('Загружаю серии...');
        getEpisodes(anime.id, function (episodes) {
            if (!episodes.length) {
                notify('Серии не найдены');
                return;
            }

            var items = episodes.map(function (ep) {
                return {
                    title: ep.name,
                    episode: ep
                };
            });

            Lampa.Select.show({
                title: anime.title,
                items: items,
                onSelect: function (item) {
                    showVoicesAndPlay(item.episode);
                },
                onBack: function () {
                    Lampa.Controller.toggle('select');
                }
            });
        });
    }

    function startSearch(query) {
        if (!query || query.length < 2) {
            notify('Введите название');
            return;
        }

        Lampa.Noty.show('Ищу...');
        searchAnime(query, function (results) {
            if (!results.length) {
                notify('Ничего не найдено');
                return;
            }

            var items = results.map(function (item) {
                return {
                    title: item.title + (item.year ? ' (' + item.year + ')' : ''),
                    anime: item
                };
            });

            Lampa.Select.show({
                title: 'Результаты поиска',
                items: items,
                onSelect: function (item) {
                    showEpisodes(item.anime);
                },
                onBack: function () {
                    Lampa.Controller.toggle('select');
                }
            });
        });
    }

    function addButton(e) {
        // Проверяем, что кнопка ещё не добавлена
        if (e.object.activity.render().find('.animelib-button').length > 0) return;

        var btn = $('<div class="full-start__button selector view--animelib animelib-button" style="background: linear-gradient(45deg, #7b5cff, #c44dff);">' +
            '<span>AnimeLib</span></div>');

        btn.on('hover:enter', function () {
            var movie = e.data.movie;
            var title = movie.title || movie.name || movie.original_title || '';

            if (title) {
                startSearch(title);
            } else {
                Lampa.Input.edit({
                    title: 'Поиск AnimeLib',
                    value: '',
                    free: true,
                    nosave: true
                }, function (value) {
                    if (value) startSearch(value);
                });
            }
        });

        // Пробуем разные места вставки кнопки
        var render = e.object.activity.render();
        var buttons = render.find('.full-start__buttons');

        if (buttons.length) {
            buttons.append(btn);
        } else {
            // Запасной вариант
            render.find('.full-start__body').append(btn);
        }
    }

    function init() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' || e.type === 'complete') {
                setTimeout(function () {
                    addButton(e);
                }, 300); // небольшая задержка, чтобы DOM успел отрисоваться
            }
        });

        console.log('[AnimeLib] Плагин загружен');
        Lampa.Noty.show('AnimeLib загружен');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
