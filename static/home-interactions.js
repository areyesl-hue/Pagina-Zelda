(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const status = document.querySelector('#interaction-status');
    let statusTimeout = 0;

    const announce = message => {
        if (!status) return;
        status.textContent = message;
        status.classList.add('is-visible');
        window.clearTimeout(statusTimeout);
        statusTimeout = window.setTimeout(() => status.classList.remove('is-visible'), 3200);
    };

    const favoriteButtons = [...document.querySelectorAll('[data-favorite-id]')];
    const favoriteList = document.querySelector('#favorites-list');
    const favoriteItems = new Map(favoriteButtons.map(button => [
        button.dataset.favoriteId,
        {
            id: button.dataset.favoriteId,
            title: button.dataset.favoriteTitle,
            href: button.closest('.character-card')
                ? button.closest('.character-card').querySelector('.character-link-action').href
                : button.dataset.favoriteHref || '#juegos'
        }
    ]));
    let favorites = [];
    let favoritesCanPersist = true;

    try {
        const storedFavorites = JSON.parse(localStorage.getItem('hyrule-favorites') || '[]');
        if (Array.isArray(storedFavorites)) {
            favorites = storedFavorites.filter(id => favoriteItems.has(id));
        }
    } catch (error) {
        favoritesCanPersist = false;
        announce('El navegador no permite leer tus favoritos guardados; estarán disponibles durante esta visita.');
    }

    const saveFavorites = () => {
        if (!favoritesCanPersist) return;
        try {
            localStorage.setItem('hyrule-favorites', JSON.stringify(favorites));
        } catch (error) {
            favoritesCanPersist = false;
            announce('No se pudieron guardar los favoritos en este navegador; se conservarán mientras esta página esté abierta.');
        }
    };

    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('#main-nav');
    const closeMenu = () => {
        mainNav?.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Abrir menú');
    };
    menuToggle?.addEventListener('click', () => {
        const isOpen = mainNav?.classList.toggle('is-open') || false;
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', event => {
        if (mainNav?.classList.contains('is-open') &&
            !mainNav.contains(event.target) && !menuToggle?.contains(event.target)) {
            closeMenu();
        }
    });

    const renderFavorites = () => {
        favoriteButtons.forEach(button => {
            const selected = favorites.includes(button.dataset.favoriteId);
            button.setAttribute('aria-pressed', String(selected));
            button.textContent = selected ? '♥' : '♡';
            button.setAttribute(
                'aria-label',
                `${selected ? 'Quitar' : 'Guardar'} ${button.dataset.favoriteTitle} ${selected ? 'de' : 'en'} favoritos`
            );
        });
        if (!favoriteList) return;
        favoriteList.replaceChildren();
        if (!favorites.length) {
            const empty = document.createElement('p');
            empty.className = 'favorites-empty';
            empty.textContent = 'Todavía no guardas favoritos. Pulsa ♡ en un personaje o juego.';
            favoriteList.appendChild(empty);
            return;
        }
        favorites.forEach(id => {
            const item = favoriteItems.get(id);
            if (!item) return;
            const chip = document.createElement('span');
            chip.className = 'favorite-chip';
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = item.title;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeFavorite = id;
            remove.setAttribute('aria-label', `Quitar ${item.title} de favoritos`);
            remove.textContent = '×';
            chip.append(link, remove);
            favoriteList.appendChild(chip);
        });
    };

    favoriteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.favoriteId;
            favorites = favorites.includes(id)
                ? favorites.filter(favorite => favorite !== id)
                : [...favorites, id];
            saveFavorites();
            renderFavorites();
            announce(`${button.dataset.favoriteTitle} ${favorites.includes(id) ? 'añadido a' : 'quitado de'} tus favoritos.`);
        });
    });

    favoriteList?.addEventListener('click', event => {
        const removeButton = event.target.closest('[data-remove-favorite]');
        if (!removeButton) return;
        const item = favoriteItems.get(removeButton.dataset.removeFavorite);
        favorites = favorites.filter(id => id !== removeButton.dataset.removeFavorite);
        saveFavorites();
        renderFavorites();
        if (item) announce(`${item.title} quitado de tus favoritos.`);
    });
    renderFavorites();

    const carousel = document.querySelector('#character-carousel');
    if (carousel) {
        const cards = [...carousel.querySelectorAll('.character-card')];
        const dotsContainer = document.querySelector('.carousel-dots');
        const previous = document.querySelector('.carousel-previous');
        const next = document.querySelector('.carousel-next');
        const position = document.querySelector('.carousel-position');
        let activeIndex = 0;
        let carouselTimer = 0;
        let carouselPaused = false;

        const goToCard = index => {
            if (!cards.length) return;
            activeIndex = (index + cards.length) % cards.length;
            carousel.scrollTo({
                left: cards[activeIndex].offsetLeft - (carousel.clientWidth - cards[activeIndex].offsetWidth) / 2,
                behavior: reducedMotion ? 'auto' : 'smooth'
            });
            updateCarousel();
        };

        const updateCarousel = () => {
            if (!cards.length) return;
            const center = carousel.scrollLeft + carousel.clientWidth / 2;
            activeIndex = cards.reduce((closestIndex, card, index) => {
                const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                const closestCenter = cards[closestIndex].offsetLeft + cards[closestIndex].offsetWidth / 2;
                return Math.abs(cardCenter - center) < Math.abs(closestCenter - center) ? index : closestIndex;
            }, 0);
            if (position) position.textContent = `${activeIndex + 1} / ${cards.length}`;
            dotsContainer?.querySelectorAll('.carousel-dot').forEach((dot, index) => {
                dot.setAttribute('aria-pressed', String(index === activeIndex));
                dot.setAttribute('aria-label', `Mostrar personaje ${index + 1}`);
            });
        };

        cards.forEach((card, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Mostrar personaje ${index + 1}`);
            dot.setAttribute('aria-pressed', String(index === 0));
            dot.addEventListener('click', () => goToCard(index));
            dotsContainer?.appendChild(dot);
        });

        previous?.addEventListener('click', () => goToCard(activeIndex - 1));
        next?.addEventListener('click', () => goToCard(activeIndex + 1));
        carousel.addEventListener('scroll', updateCarousel, { passive: true });
        carousel.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                goToCard(activeIndex + 1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goToCard(activeIndex - 1);
            }
        });

        const stopCarousel = () => {
            carouselPaused = true;
            window.clearInterval(carouselTimer);
        };
        const startCarousel = () => {
            if (reducedMotion || carouselPaused || document.hidden) return;
            window.clearInterval(carouselTimer);
            carouselTimer = window.setInterval(() => goToCard(activeIndex + 1), 6500);
        };
        carousel.addEventListener('pointerenter', stopCarousel);
        carousel.addEventListener('pointerleave', () => {
            carouselPaused = false;
            startCarousel();
        });
        carousel.addEventListener('focusin', stopCarousel);
        carousel.addEventListener('focusout', event => {
            if (!carousel.contains(event.relatedTarget)) {
                carouselPaused = false;
                startCarousel();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) window.clearInterval(carouselTimer);
            else startCarousel();
        });
        window.addEventListener('resize', updateCarousel, { passive: true });
        updateCarousel();
        startCarousel();
    }

    const eraContent = {
        classic: {
            index: 'ERA 01 · 1998',
            title: 'El tiempo despierta una leyenda',
            description: 'Ocarina of Time lleva a Link a través de distintas edades de Hyrule para enfrentarse al poder de Ganondorf.',
            game: 'Ocarina of Time',
            rail: '0%'
        },
        twilight: {
            index: 'ERA 02 · 2006',
            title: 'La frontera entre luz y sombras',
            description: 'En Twilight Princess, Link cruza un reino cubierto por la penumbra para devolver la luz a Hyrule.',
            game: 'Twilight Princess',
            rail: '100%'
        },
        wild: {
            index: 'ERA 03 · 2017—2023',
            title: 'Un Hyrule que vuelve a ser salvaje',
            description: 'Breath of the Wild y Tears of the Kingdom abren el reino a la exploración libre, desde la tierra hasta el cielo.',
            game: 'Breath of the Wild',
            rail: '200%'
        }
    };
    const eraPanel = document.querySelector('#era-panel');
    const eraTabs = [...document.querySelectorAll('[data-era]')];
    eraTabs.forEach((tab, index) => {
        tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
        tab.addEventListener('click', () => {
            const era = eraContent[tab.dataset.era];
            if (!era || !eraPanel) return;
            eraTabs.forEach(candidate => {
                const selected = candidate === tab;
                candidate.setAttribute('aria-selected', String(selected));
                candidate.tabIndex = selected ? 0 : -1;
                candidate.id = `era-tab-${candidate.dataset.era}`;
                if (selected) eraPanel.setAttribute('aria-labelledby', candidate.id);
            });
            eraPanel.querySelector('.era-panel-index').textContent = era.index;
            eraPanel.querySelector('h3').textContent = era.title;
            eraPanel.querySelector('p').textContent = era.description;
            const eraLink = eraPanel.querySelector('.text-link');
            eraLink.href = '#juegos';
            eraLink.setAttribute('aria-label', `Ver ${era.game} en aventuras`);
            eraPanel.classList.remove('is-changing');
            void eraPanel.offsetWidth;
            eraPanel.classList.add('is-changing');
            document.querySelector('.era-rail span').style.transform = `translateX(${era.rail})`;
        });
        tab.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const nextIndex = event.key === 'Home' ? 0
                : event.key === 'End' ? eraTabs.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + eraTabs.length) % eraTabs.length;
            eraTabs[nextIndex].focus();
            eraTabs[nextIndex].click();
        });
    });

    const placeContent = {
        castle: ['Castillo de Hyrule', 'El corazón del reino, hogar de la familia real y escenario de muchos momentos decisivos.'],
        forest: ['Bosques perdidos', 'Un bosque misterioso donde los senderos cambian y la música puede guiar a los viajeros.'],
        mountain: ['Montañas de la Muerte', 'Territorio volcánico de cumbres escarpadas, hogar de los goron en distintas eras.'],
        desert: ['Desierto Gerudo', 'Una vasta región de arena y cañones que guarda rutas antiguas y una cultura propia.']
    };
    const mapDetail = document.querySelector('.map-detail');
    const mapLocations = [...document.querySelectorAll('.map-location')];
    const map = document.querySelector('.hyrule-map');
    let activeMapImage = map?.querySelector('.map-scene.is-active');
    let mapImageRequest = 0;
    mapLocations.forEach((button, index) => {
        button.addEventListener('click', () => {
            const place = placeContent[button.dataset.place];
            if (!place || !mapDetail || !map || !activeMapImage) return;
            const nextMapImage = map.querySelector('.map-scene-next');
            const imageUrl = button.dataset.mapImage;
            if (!nextMapImage || !imageUrl) {
                announce('No se pudo cargar la imagen de este destino.');
                return;
            }

            const requestId = ++mapImageRequest;
            const finishSelection = (switchImage = true) => {
                if (requestId !== mapImageRequest) return;
                mapLocations.forEach(location => {
                    const selected = location === button;
                    location.classList.toggle('is-selected', selected);
                    location.setAttribute('aria-pressed', String(selected));
                });
                const placeCount = mapDetail.querySelector('#map-place-count');
                if (placeCount) placeCount.textContent = `DESTINO ${String(index + 1).padStart(2, '0')} / ${String(mapLocations.length).padStart(2, '0')}`;
                mapDetail.querySelector('h3').textContent = place[0];
                mapDetail.querySelector('p').textContent = place[1];
                mapDetail.classList.remove('is-changing');
                void mapDetail.offsetWidth;
                mapDetail.classList.add('is-changing');
                if (!switchImage) return;
                nextMapImage.classList.add('is-active');
                activeMapImage.classList.remove('is-active');
                activeMapImage.classList.add('map-scene-next');
                nextMapImage.classList.remove('map-scene-next');
                activeMapImage = nextMapImage;
            };

            if (new URL(imageUrl, window.location.href).href === activeMapImage.src) {
                finishSelection(false);
                return;
            }

            nextMapImage.onload = finishSelection;
            nextMapImage.onerror = () => {
                if (requestId === mapImageRequest) announce('No se pudo cargar la imagen de este destino.');
            };
            nextMapImage.style.setProperty('--map-scene-position', button.dataset.mapPosition || 'center');
            nextMapImage.src = imageUrl;
        });
    });

    const gameCards = [...document.querySelectorAll('.game-card')];

    const searchForm = document.querySelector('#site-search-form');
    const searchInput = document.querySelector('#site-search');
    const searchResults = document.querySelector('#search-results');
    const searchCatalog = [
        ['Link', 'El héroe de Hyrule', '/link', 'héroe espada personaje'],
        ['Zelda', 'La princesa de Hyrule', '/zelda', 'princesa sabiduría personaje'],
        ['Ganondorf', 'El rey demonio', '/ganondorf', 'villano oscuridad personaje'],
        ['Ocarina of Time', 'Aventura de 1998', '#juegos', 'ocarina clásico 1998'],
        ['Twilight Princess', 'Luz y oscuridad', '#juegos', 'twilight sombras 2006'],
        ['Breath of the Wild', 'Explora un Hyrule inmenso', '#juegos', 'breath wild 2017'],
        ['Tears of the Kingdom', 'Aventura entre cielo y tierra', '#juegos', 'tears kingdom 2023'],
        ['Espada Maestra', 'El arma legendaria del héroe', '/espada', 'master sword mastersword espada'],
        ['Mapa de Hyrule', 'Descubre lugares del reino', '#explorar-hyrule', 'mapa castillo bosque gerudo'],
        ['Eras de Hyrule', 'Recorre la historia de la saga', '#eras', 'eras cronología historia']
    ];
    let activeSearchIndex = -1;
    const renderSearchSuggestions = () => {
        if (!searchInput || !searchResults) return;
        const query = searchInput.value.trim().toLocaleLowerCase('es');
        if (!query) {
            searchResults.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
            activeSearchIndex = -1;
            return;
        }
        const matches = searchCatalog.filter(item =>
            item.join(' ').toLocaleLowerCase('es').includes(query)
        ).slice(0, 6);
        searchResults.replaceChildren();
        if (!matches.length) {
            const empty = document.createElement('p');
            empty.textContent = 'No encontramos resultados. Prueba con otro término.';
            searchResults.appendChild(empty);
        } else {
            matches.forEach(([title, description, href], index) => {
                const link = document.createElement('a');
                link.href = href;
                link.id = `site-search-option-${index}`;
                link.setAttribute('role', 'option');
                link.setAttribute('aria-selected', 'false');
                const heading = document.createElement('strong');
                heading.textContent = title;
                const summary = document.createElement('span');
                summary.textContent = description;
                link.append(heading, summary);
                searchResults.appendChild(link);
            });
        }
        searchResults.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
        activeSearchIndex = -1;
    };
    searchInput?.setAttribute('role', 'combobox');
    searchInput?.setAttribute('aria-autocomplete', 'list');
    searchInput?.setAttribute('aria-controls', 'search-results');
    searchInput?.setAttribute('aria-expanded', 'false');
    searchInput?.addEventListener('input', renderSearchSuggestions);
    searchForm?.addEventListener('submit', event => {
        event.preventDefault();
        renderSearchSuggestions();
    });
    searchInput?.addEventListener('keydown', event => {
        if (!searchResults || searchResults.hidden) return;
        const options = [...searchResults.querySelectorAll('a[role="option"]')];
        if (event.key === 'Escape') {
            searchResults.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.removeAttribute('aria-activedescendant');
            activeSearchIndex = -1;
        } else if (event.key === 'ArrowDown' && options.length) {
            event.preventDefault();
            activeSearchIndex = (activeSearchIndex + 1) % options.length;
        } else if (event.key === 'ArrowUp' && options.length) {
            event.preventDefault();
            activeSearchIndex = (activeSearchIndex - 1 + options.length) % options.length;
        } else if (event.key === 'Enter' && activeSearchIndex >= 0 && options[activeSearchIndex]) {
            event.preventDefault();
            options[activeSearchIndex].click();
            return;
        } else {
            return;
        }
        options.forEach((option, index) => {
            const selected = index === activeSearchIndex;
            option.setAttribute('aria-selected', String(selected));
            if (selected) searchInput.setAttribute('aria-activedescendant', option.id);
        });
        if (activeSearchIndex < 0) searchInput.removeAttribute('aria-activedescendant');
    });
    searchForm?.addEventListener('submit', event => {
        event.preventDefault();
        renderSearchSuggestions();
        if (!searchInput?.value.trim()) searchInput?.focus();
    });
    searchResults?.addEventListener('click', event => {
        if (!event.target.closest('a')) return;
        searchResults.hidden = true;
        searchInput?.setAttribute('aria-expanded', 'false');
        searchInput?.removeAttribute('aria-activedescendant');
    });
    document.addEventListener('click', event => {
        if (searchForm && !searchForm.contains(event.target) && searchResults && searchInput) {
            searchResults.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.removeAttribute('aria-activedescendant');
        }
    });

    const galleryItems = [...document.querySelectorAll('.gallery-item')];
    const galleryDialog = document.querySelector('#gallery-modal');
    const galleryImage = document.querySelector('#gallery-large');
    const galleryCaption = document.querySelector('#gallery-caption');
    let galleryIndex = 0;
    let galleryTouchStartX = null;
    const showGalleryItem = index => {
        if (!galleryItems.length || !galleryImage || !galleryCaption) return;
        galleryIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[galleryIndex];
        galleryImage.src = item.dataset.gallerySrc;
        galleryImage.alt = item.dataset.galleryAlt;
        galleryImage.decoding = 'async';
        galleryCaption.textContent = item.dataset.galleryCaption;
    };
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showGalleryItem(index);
            galleryDialog?.showModal();
        });
    });
    document.querySelector('.gallery-prev')?.addEventListener('click', () => showGalleryItem(galleryIndex - 1));
    document.querySelector('.gallery-next')?.addEventListener('click', () => showGalleryItem(galleryIndex + 1));
    document.querySelector('[data-gallery-close]')?.addEventListener('click', () => galleryDialog?.close());
    galleryDialog?.addEventListener('click', event => {
        if (event.target === galleryDialog) galleryDialog.close();
    });
    galleryDialog?.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') showGalleryItem(galleryIndex - 1);
        if (event.key === 'ArrowRight') showGalleryItem(galleryIndex + 1);
    });
    galleryImage?.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') galleryTouchStartX = event.clientX;
    }, { passive: true });
    galleryImage?.addEventListener('pointerup', event => {
        if (galleryTouchStartX === null) return;
        const swipeDistance = event.clientX - galleryTouchStartX;
        galleryTouchStartX = null;
        if (Math.abs(swipeDistance) < 45) return;
        showGalleryItem(galleryIndex + (swipeDistance < 0 ? 1 : -1));
    }, { passive: true });
    galleryImage?.addEventListener('pointercancel', () => {
        galleryTouchStartX = null;
    }, { passive: true });

    const quizQuestions = [
        { question: '¿Qué objeto permite a Link viajar entre distintas edades en Ocarina of Time?', answers: ['La Ocarina del Tiempo', 'La Lira de la Diosa', 'El Cetro de los Vientos', 'La Máscara Majora'], correct: 0 },
        { question: '¿Qué virtud se asocia tradicionalmente con Link?', answers: ['Poder', 'Valor', 'Sabiduría', 'Paciencia'], correct: 1 },
        { question: '¿Cómo se llama el arma legendaria vinculada al héroe?', answers: ['Espada Kokiri', 'Espada Maestra', 'Espada Biggoron', 'Espada de la Guardia'], correct: 1 },
        { question: '¿Qué reino protege Zelda?', answers: ['Termina', 'Lorule', 'Hyrule', 'Labrynna'], correct: 2 },
        { question: '¿Qué juego de esta página lleva a Link a explorar tierras y cielos?', answers: ['Twilight Princess', 'Ocarina of Time', 'A Link to the Past', 'Tears of the Kingdom'], correct: 3 }
    ];
    const quizStart = document.querySelector('#quiz-start');
    const quizPlay = document.querySelector('#quiz-play');
    const quizResult = document.querySelector('#quiz-result');
    const quizQuestion = document.querySelector('#quiz-question');
    const quizAnswers = document.querySelector('#quiz-answers');
    const quizFeedback = document.querySelector('#quiz-feedback');
    const quizNext = document.querySelector('#quiz-next');
    const quizProgress = document.querySelector('#quiz-progress');
    const quizScore = document.querySelector('#quiz-score');
    const quizBest = document.querySelector('#quiz-best');
    let quizIndex = 0;
    let quizPoints = 0;
    let quizAnswered = false;
    let quizDeck = [];

    const shuffle = items => {
        const shuffled = [...items];
        for (let index = shuffled.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }
        return shuffled;
    };

    let quizBestScore = 0;
    try {
        const savedBest = Number(localStorage.getItem('hyrule-quiz-best') || 0);
        if (Number.isFinite(savedBest)) quizBestScore = Math.min(quizQuestions.length, Math.max(0, savedBest));
    } catch (error) {
        announce('El navegador no permite recuperar tu récord del quiz.');
    }
    const updateQuizBest = () => {
        if (quizBest) quizBest.textContent = `RÉCORD: ${quizBestScore} / ${quizQuestions.length}`;
    };
    updateQuizBest();

    const showQuestion = () => {
        const current = quizDeck[quizIndex];
        quizAnswered = false;
        quizProgress.textContent = `PREGUNTA ${quizIndex + 1} DE ${quizQuestions.length}`;
        quizScore.textContent = `ACIERTOS: ${quizPoints}`;
        quizQuestion.textContent = current.question;
        quizFeedback.textContent = '';
        quizNext.hidden = true;
        quizAnswers.replaceChildren();
        current.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-answer';
            button.textContent = answer;
            button.addEventListener('click', () => {
                if (quizAnswered) return;
                quizAnswered = true;
                const correct = index === current.correct;
                if (correct) quizPoints++;
                button.classList.add(correct ? 'is-correct' : 'is-wrong');
                if (!correct) quizAnswers.children[current.correct].classList.add('is-correct');
                quizAnswers.querySelectorAll('button').forEach(answerButton => {
                    answerButton.disabled = true;
                });
                quizFeedback.textContent = correct
                    ? '¡Correcto! Tu sabiduría sobre Hyrule crece.'
                    : `Casi. La respuesta era: ${current.answers[current.correct]}.`;
                quizScore.textContent = `ACIERTOS: ${quizPoints}`;
                quizNext.hidden = false;
                quizNext.textContent = quizIndex === quizQuestions.length - 1 ? 'Ver resultado' : 'Siguiente pregunta →';
                quizNext.focus();
            });
            quizAnswers.appendChild(button);
        });
    };

    quizStart?.addEventListener('click', () => {
        quizIndex = 0;
        quizPoints = 0;
        quizDeck = shuffle(quizQuestions).map(question => {
            const answers = shuffle(question.answers.map((answer, index) => ({
                answer,
                correct: index === question.correct
            })));
            return {
                ...question,
                answers: answers.map(item => item.answer),
                correct: answers.findIndex(item => item.correct)
            };
        });
        quizResult.hidden = true;
        quizPlay.hidden = false;
        quizStart.hidden = true;
        showQuestion();
        quizAnswers.querySelector('button')?.focus();
    });
    quizNext?.addEventListener('click', () => {
        quizIndex++;
        if (quizIndex < quizQuestions.length) {
            showQuestion();
            quizAnswers.querySelector('button')?.focus();
            return;
        }
        quizPlay.hidden = true;
        quizResult.hidden = false;
        const rank = quizPoints === 5 ? 'Sabio de la Trifuerza'
            : quizPoints >= 3 ? 'Explorador de Hyrule'
                : 'Aprendiz de aventurero';
        quizResult.replaceChildren();
        const title = document.createElement('h3');
        title.textContent = `${quizPoints} / ${quizQuestions.length} · ${rank}`;
        if (quizPoints > quizBestScore) {
            quizBestScore = quizPoints;
            try {
                localStorage.setItem('hyrule-quiz-best', String(quizBestScore));
            } catch (error) {
                announce('Nuevo récord, pero el navegador no pudo guardarlo.');
            }
        }
        updateQuizBest();
        const description = document.createElement('p');
        description.textContent = quizPoints === 5
            ? 'Dominas las leyendas del reino. ¡La Trifuerza te reconoce!'
            : 'Cada aventura revela algo nuevo. ¿Te animas a intentarlo otra vez?';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn-primary';
        retry.textContent = 'Jugar de nuevo';
        retry.addEventListener('click', () => quizStart.click());
        quizResult.append(title, description, retry);
        retry.focus();
    });

    const heroVideo = document.querySelector('.home-page .hero-video');
    const videoSource = heroVideo?.querySelector('source[data-src]');
    const connection = navigator.connection;
    const avoidVideo = reducedMotion || window.matchMedia('(max-width: 800px)').matches ||
        connection?.saveData ||
        ['slow-2g', '2g'].includes(connection?.effectiveType);
    if (heroVideo && videoSource && !avoidVideo) {
        const loadAndPlayVideo = () => {
            if (!videoSource.src) {
                videoSource.src = videoSource.dataset.src;
                heroVideo.load();
            }
            heroVideo.play().catch(() => {
                heroVideo.dataset.playback = 'poster';
            });
        };
        const videoObserver = 'IntersectionObserver' in window
            ? new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !document.hidden) loadAndPlayVideo();
                    else heroVideo.pause();
                });
            }, { threshold: 0.1 })
            : null;
        if (videoObserver) videoObserver.observe(heroVideo);
        else loadAndPlayVideo();
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) heroVideo.pause();
            else if (heroVideo.getBoundingClientRect().bottom > 0) loadAndPlayVideo();
        });
    }

    const runeButtons = [...document.querySelectorAll('[data-rune]')];
    let foundRunes = [];
    let runesCanPersist = true;
    try {
        const storedRunes = JSON.parse(localStorage.getItem('hyrule-runes') || '[]');
        if (Array.isArray(storedRunes)) {
            foundRunes = storedRunes.filter(id => runeButtons.some(button => button.dataset.rune === id));
        }
    } catch (error) {
        runesCanPersist = false;
        announce('El navegador no permite recuperar los símbolos secretos de visitas anteriores.');
    }
    const updateRunes = () => {
        runeButtons.forEach(button => {
            const found = foundRunes.includes(button.dataset.rune);
            button.classList.toggle('is-found', found);
            button.setAttribute('aria-pressed', String(found));
        });
    };
    runeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (foundRunes.includes(button.dataset.rune)) {
                announce('Ya encontraste este símbolo de la Trifuerza.');
                return;
            }
            foundRunes = [...foundRunes, button.dataset.rune];
            updateRunes();
            if (runesCanPersist) {
                try {
                    localStorage.setItem('hyrule-runes', JSON.stringify(foundRunes));
                } catch (error) {
                    runesCanPersist = false;
                    announce('Símbolo encontrado, pero no se pudo guardar para futuras visitas.');
                }
            }
            if (foundRunes.length === runeButtons.length) {
                announce('¡Encontraste los tres fragmentos! La leyenda secreta de Hyrule ya es tuya. ✨');
            } else {
                announce(`Fragmento secreto encontrado: ${foundRunes.length} de ${runeButtons.length}.`);
            }
        });
    });
    updateRunes();
})();
