(function () {
    'use strict';

    console.log('[AnimeLib] Плагин начал загрузку');

    function addButton() {
        // Ищем блок с кнопками
        var buttons = document.querySelector('.full-start__buttons');
        if (!buttons) return;

        // Если кнопка уже есть — не добавляем второй раз
        if (document.querySelector('.animelib-btn')) return;

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector animelib-btn';
        btn.style.background = 'linear-gradient(45deg, #7b5cff, #c44dff)';
        btn.innerHTML = '<span>AnimeLib</span>';

        btn.addEventListener('hover:enter', function () {
            var title = '';
            try {
                // Пытаемся взять название из карточки
                var titleEl = document.querySelector('.full-start__title');
                if (titleEl) title = titleEl.innerText.trim();
            } catch (e) {}

            if (!title) {
                Lampa.Noty.show('Не удалось определить название');
                return;
            }

            Lampa.Noty.show('Ищу: ' + title);
            // Пока просто уведомление — дальше доработаем поиск
            startSearch(title);
        });

        buttons.appendChild(btn);
        console.log('[AnimeLib] Кнопка добавлена');
    }

    // Следим за открытием карточки
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite' || e.type === 'complete') {
            setTimeout(addButton, 500);
            setTimeout(addButton, 1500); // на всякий случай ещё раз
        }
    });

    // Также пробуем добавлять периодически (на случай если событие не сработало)
    setInterval(function () {
        if (document.querySelector('.full-start__buttons') && !document.querySelector('.animelib-btn')) {
            addButton();
        }
    }, 2000);

    // ===== Остальной функционал =====
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
        Lampa.Noty.show('Ищу на AnimeLib...');
        var url = API_BASE + '/anime?q=' + encodeURIComponent(query) + '&limit=12';

        request(url, function (json) {
            var results = (json.data || []).map(function (item) {
                return {
                    title: (item.rus_name || item.name) + (item.year ? ' (' + item.year + ')' : ''),
                    id: item.id,
                    anime: item
                };
            });

            if (!results.length) {
                Lampa.Noty.show('Ничего не найдено');
                return;
            }

            Lampa.Select.show({
                title: 'AnimeLib',
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
                var p = item.player;
                if (p && p.link) {
                    Lampa.Player.play({
                        title: episode.name || 'Серия',
                        url: p.link,
                        quality: { 'HD': p.link }
                    });
                } else {
                    Lampa.Noty.show('Нет ссылки');
                }
            }
        });
    }

    console.log('[AnimeLib] Плагин загружен');
    Lampa.Noty.show('AnimeLib готов');

})();
