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
        var fullUrl = proxyUrl(url);
        var network = new Lampa.Reguest();

        network.silent(fullUrl, function (data) {
            try {
                if (typeof data === 'string') data = JSON.parse(data);
                success(data);
            } catch (e) {
                if (error) error(e);
                else Lampa.Noty.show('Ошибка разбора ответа');
            }
        }, function (err) {
            // Пробуем второй прокси
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

    // ===== Поиск аниме =====
    function searchAnime(query, callback) {
        var url = API_BASE + '/anime?q=' + encodeURIComponent(query) + '&limit=20';
        request(url, function (json) {
            var results = (json.data || []).map(function (item) {
                return {
                    id: item.id,
                    title: item.rus_name || item.name,
                    original_title: item.name,
                    year: item.year,
                    poster: item.image && item.image.preview ? item.image.preview : '',
                    description: item.summary || ''
                };
            });
            callback(results);
        }, function () {
            notify('Ошибка поиска');
            callback([]);
        });
    }

    // ===== Получение эпизодов =====
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

    // ===== Извлечение потока =====
    function extractStream(player, callback) {
        if (!player || !player.player) {
            callback(null);
            return;
        }

        // Animelib
        if (player.player === 'Animelib' || player.player === 'animelib') {
            if (player.link) {
                callback({
                    url: player.link,
                    quality: player.quality || 'HD',
                    title: player.team ? player.team.name : 'AnimeLib'
                });
                return;
            }
        }

        // Kodik
        if (player.player === 'Kodik' || player.player === 'kodik') {
            if (player.link) {
                // Пробуем получить прямую ссылку через прокси
                var kodikUrl = 'https://kodik.info' + player.link;
                request(kodikUrl, function (html) {
                    // Простой поиск mp4/m3u8 в ответе
                    var match = html.match(/(https?:\/\/[^"'\s]+\.(mp4|m3u8)[^"'\s]*)/i);
                    if (match) {
                        callback({
                            url: match[1],
                            quality: 'HD',
                            title: 'Kodik'
                        });
                    } else {
                        // Если не нашли — отдаём саму ссылку Kodik (Lampa иногда может её открыть)
                        callback({
                            url: kodikUrl,
                            quality: 'HD',
                            title: 'Kodik'
                        });
                    }
                }, function () {
                    callback({
                        url: player.link,
                        quality: 'HD',
                        title: 'Kodik'
                    });
                });
                return;
            }
        }

        // Другие плееры — просто отдаём ссылку
        if (player.link) {
            callback({
                url: player.link,
                quality: player.quality || 'HD',
                title: player.player || 'Stream'
            });
        } else {
            callback(null);
        }
    }

    // ===== Показ выбора озвучки и запуск =====
    function showVoicesAndPlay(episode) {
        if (!episode.players || !episode.players.length) {
            notify('Нет доступных озвучек');
            return;
        }

        var items = episode.players.map(function (p, index) {
            var team = p.team && p.team.name ? p.team.name : (p.player || 'Озвучка');
            var quality = p.quality ? ' [' + p.quality + ']' : '';
            return {
                title: team + quality,
                player: p,
                index: index
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

    // ===== Показ списка серий =====
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

    // ===== Поиск и выбор тайтла =====
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

    // ===== Добавление кнопки на карточку =====
    function addButton(data) {
        if (!data || !data.movie) return;

        var button = $('<div class="full-start__button selector view--anime_lib" style="background: linear-gradient(45deg, #6b5ce7, #9b59b6);">AnimeLib</div>');

        button.on('hover:enter', function () {
            var title = data.movie.title || data.movie.name || data.movie.original_title || '';
            if (title) {
                startSearch(title);
            } else {
                // Если нет названия — просим ввести вручную
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

        $('.full-start__buttons', data.render).append(button);
    }

    // ===== Инициализация =====
    function init() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                addButton(e.data);
            }
        });

        // Также можно добавить в меню поиска (опционально)
        console.log('[AnimeLib] Плагин загружен');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
