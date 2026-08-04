// ============================================================
//  БАЗА ДАННЫХ: композиторы и пути к аудиофайлам
// ============================================================
const COMPOSERS_DB = [
    {
        name: 'Пётр Ильич Чайковский',
        audioSrc: 'audio/chaikovsky_oktabr.mp3'
    },
    {
        name: 'Пётр Ильич Чайковский',
        audioSrc: 'audio/chaikovsky_razmyshlenie.mp3'
    },
    {
        name: 'Евгений Дмитриевич Дога',
        audioSrc: 'audio/doga_grammofon.mp3'
    },
    {
        name: 'Людовико Эйнауди',
        audioSrc: 'audio/einaudi_experience.mp3'
    },
    {
        name: 'Ференц Лист',
        audioSrc: 'audio/list_grezylubvi.mp3'
    },
    {
        name: 'Сергей Васильевич Рахманинов',
        audioSrc: 'audio/rahmaninoff_concert2.mp3'
    },
    {
        name: 'Сергей Васильевич Рахманинов',
        audioSrc: 'audio/rahmaninoff_preludedodiezminor.mp3'
    },
    {
        name: 'Альфред Гарриевич Шнитке',
        audioSrc: 'audio/shnitke_lesskazok.mp3'
    },
    {
        name: 'Альфред Гарриевич Шнитке',
        audioSrc: 'audio/shnitke_polkamertvyedushi.mp3'
    },
    {
        name: 'Дмитрий Дмитриевич Шостакович',
        audioSrc: 'audio/shostakovich_prelude5remajor.mp3'
    },
    {
        name: 'Георгий Васильевич Свиридов',
        audioSrc: 'audio/sviridiv_metel.mp3'
    }
];

// ============================================================
//  СОСТОЯНИЕ ИГРЫ
// ============================================================
const TOTAL_QUESTIONS = 5;

let state = {
    allQuestions: [],
    currentIndex: 0,
    score: 0,
    isAnswered: false,
    isPlaying: false,
    audioElement: null,
    audioContext: null,
    sourceNode: null,
    animationId: null,
};

// DOM-элементы
const $ = id => document.getElementById(id);
const startScreen = $('startScreen');
const gameScreen = $('gameScreen');
const resultScreen = $('resultScreen');
const scoreDisplay = $('scoreDisplay');
const trackInfo = $('trackInfo');
const optionsContainer = $('optionsContainer');
const feedback = $('feedback');
const btnNext = $('btnNext');
const btnStart = $('btnStart');
const btnRestart = $('btnRestart');
const pulseRing = $('pulseRing');
const finalScore = $('finalScore');
const resultTitle = $('resultTitle');
const resultDetail = $('resultDetail');

// ============================================================
//  ГЕНЕРАЦИЯ ВОПРОСОВ
// ============================================================
function generateQuestions() {
    const shuffled = [...COMPOSERS_DB];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, TOTAL_QUESTIONS);

    return selected.map((composer) => {
        const others = COMPOSERS_DB.filter(c => c.name !== composer.name);
        const shuffledOthers = [...others];
        for (let i = shuffledOthers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]];
        }
        const wrong = shuffledOthers[0] || COMPOSERS_DB[0];

        const correctPosition = Math.random() < 0.5 ? 0 : 1;
        const options = [
            { name: composer.name, isCorrect: correctPosition === 0 },
            { name: wrong.name, isCorrect: correctPosition === 1 }
        ];

        return {
            composer: composer,
            options: options,
            correctIndex: correctPosition
        };
    });
}

// ============================================================
//  ПОЛНАЯ ОСТАНОВКА АУДИО
// ============================================================
function stopAudio() {
    state.isPlaying = false;
    
    // Останавливаем анимацию
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    // Останавливаем аудио и очищаем
    if (state.audioElement) {
        try {
            state.audioElement.pause();
            state.audioElement.currentTime = 0;
            state.audioElement.src = ''; // Очищаем src
        } catch (e) {
            console.warn('Ошибка при остановке аудио:', e);
        }
        state.audioElement = null;
    }
    
    // Закрываем AudioContext, если он есть
    if (state.audioContext && state.audioContext.state !== 'closed') {
        try {
            state.audioContext.close();
        } catch (e) {
            console.warn('Ошибка при закрытии AudioContext:', e);
        }
        state.audioContext = null;
    }
    
    state.sourceNode = null;
    
    // Сбрасываем рамку
    pulseRing.className = 'pulse-ring';
    pulseRing.style.borderColor = 'rgba(41, 128, 255, 0.05)';
    pulseRing.style.boxShadow = 'inset 0 0 30px rgba(41, 128, 255, 0), 0 0 30px rgba(41, 128, 255, 0)';
    pulseRing.style.background = 'transparent';
}

// ============================================================
//  ПРОИГРЫВАНИЕ АУДИО (исправленная версия)
// ============================================================
function playMelody(composer) {
    console.log('▶ Воспроизведение:', composer.name);
    
    // Полная остановка всего старого аудио
    stopAudio();
    
    try {
        // Создаём новый аудиоэлемент
        const audio = new Audio(composer.audioSrc);
        audio.crossOrigin = 'anonymous';
        
        // Создаём новый AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Создаём новый MediaElementSource
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Сохраняем в состояние
        state.audioElement = audio;
        state.audioContext = audioContext;
        state.sourceNode = source;
        state.analyser = analyser;
        state.isPlaying = true;
        
        // Обработчик начала воспроизведения
        audio.addEventListener('canplaythrough', function onCanPlay() {
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.play().then(() => {
                console.log('✅ Воспроизведение начато');
                startPulseAnimation();
            }).catch(err => {
                console.warn('❌ Ошибка воспроизведения:', err);
                state.isPlaying = false;
            });
        });
        
        audio.addEventListener('error', function(e) {
            console.warn('❌ Ошибка загрузки аудио:', composer.audioSrc);
            state.isPlaying = false;
            // Запускаем анимацию без звука
            startPulseAnimation();
        });
        
        // Начинаем загрузку
        audio.load();
        
    } catch (e) {
        console.error('❌ Критическая ошибка:', e);
        state.isPlaying = false;
        startPulseAnimation();
    }
}

// ============================================================
//  АНИМАЦИЯ ПУЛЬСАЦИИ
// ============================================================
function startPulseAnimation() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
    }
    
    let startTime = Date.now();
    
    function animatePulse() {
        if (!state.isPlaying) {
            // Если нет звука, делаем плавную пульсацию
            const elapsed = (Date.now() - startTime) / 1000;
            const intensity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 2));
            updatePulseRingIntensity(intensity);
            state.animationId = requestAnimationFrame(animatePulse);
            return;
        }
        
        // Если есть звук, используем данные из анализатора
        if (state.analyser) {
            try {
                const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
                state.analyser.getByteFrequencyData(dataArray);
                
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const intensity = average / 255;
                
                updatePulseRingIntensity(intensity);
                
            } catch (e) {
                // Если ошибка, делаем плавную пульсацию
                const elapsed = (Date.now() - startTime) / 1000;
                const intensity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 2));
                updatePulseRingIntensity(intensity);
            }
        } else {
            // Если нет анализатора, делаем плавную пульсацию
            const elapsed = (Date.now() - startTime) / 1000;
            const intensity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 2));
            updatePulseRingIntensity(intensity);
        }
        
        state.animationId = requestAnimationFrame(animatePulse);
    }
    
    animatePulse();
}

function updatePulseRingIntensity(intensity) {
    pulseRing.classList.add('active');
    
    if (intensity > 0.7) {
        pulseRing.className = 'pulse-ring intense';
    } else if (intensity > 0.4) {
        pulseRing.className = 'pulse-ring strong';
    } else {
        pulseRing.className = 'pulse-ring active';
    }

    const glow = 30 + intensity * 100;
    const borderOpacity = 0.2 + intensity * 0.7;
    const insetGlow = intensity * 120;
    
    pulseRing.style.borderColor = 'rgba(41, 128, 255, ' + borderOpacity + ')';
    pulseRing.style.boxShadow = 
        'inset 0 0 ' + insetGlow + 'px rgba(41, 128, 255, ' + (0.05 + intensity * 0.2) + '), ' +
        'inset 0 0 ' + (insetGlow * 1.5) + 'px rgba(41, 128, 255, ' + (0.02 + intensity * 0.1) + '), ' +
        '0 0 ' + glow + 'px rgba(41, 128, 255, ' + (0.05 + intensity * 0.15) + ')';
    
    const alpha = 0.02 + intensity * 0.1;
    pulseRing.style.background = 'radial-gradient(' +
        'ellipse at center, ' +
        'rgba(41, 128, 255, ' + alpha + ') 0%, ' +
        'rgba(41, 128, 255, ' + (alpha * 0.5) + ') 40%, ' +
        'transparent 70%' +
    ')';
}

// ============================================================
//  ЛОГИКА ИГРЫ
// ============================================================
function loadQuestion(index) {
    const q = state.allQuestions[index];
    if (!q) return;

    state.isAnswered = false;
    feedback.textContent = '';
    feedback.className = 'feedback';
    btnNext.style.display = 'none';

    scoreDisplay.textContent = state.score;

    const btns = optionsContainer.querySelectorAll('.btn-option');
    btns.forEach((btn, i) => {
        btn.textContent = q.options[i].name;
        btn.className = 'btn-option';
        btn.disabled = false;
        btn.dataset.correct = q.options[i].isCorrect ? 'true' : 'false';
    });

    trackInfo.textContent = 'Отрывок произведения';

    setTimeout(() => {
        playMelody(q.composer);
    }, 300);
}

function handleOptionClick(e) {
    const btn = e.currentTarget;
    if (state.isAnswered) return;
    if (btn.disabled) return;

    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 300);

    const isCorrect = btn.dataset.correct === 'true';
    state.isAnswered = true;

    stopAudio();

    const allBtns = optionsContainer.querySelectorAll('.btn-option');
    allBtns.forEach(b => b.disabled = true);

    allBtns.forEach(b => {
        if (b.dataset.correct === 'true') {
            b.classList.add('correct');
        } else if (b === btn && !isCorrect) {
            b.classList.add('wrong');
        }
    });

    if (isCorrect) {
        state.score += 1;
        scoreDisplay.textContent = state.score;
        feedback.textContent = 'Правильно! Отлично!';
        feedback.className = 'feedback correct';
    } else {
        const correctName = state.allQuestions[state.currentIndex].options.find(o => o.isCorrect).name;
        feedback.textContent = 'Неверно. Правильный ответ: ' + correctName;
        feedback.className = 'feedback wrong';
    }

    if (state.currentIndex < state.allQuestions.length - 1) {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Следующий вопрос';
    } else {
        btnNext.style.display = 'block';
        btnNext.textContent = 'Узнать результат';
    }
}

function goToNext() {
    state.currentIndex++;
    if (state.currentIndex < state.allQuestions.length) {
        loadQuestion(state.currentIndex);
    } else {
        showResult();
    }
}

function showResult() {
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    startScreen.style.display = 'none';

    const total = state.allQuestions.length;
    finalScore.textContent = state.score + '/' + total;

    if (state.score === total) {
        resultTitle.textContent = 'Идеально!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.8) {
        resultTitle.textContent = 'Отлично!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.6) {
        resultTitle.textContent = 'Очень хорошо!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    } else if (state.score >= total * 0.4) {
        resultTitle.textContent = 'Хорошо!';
        resultDetail.textContent = 'Отлично справляетесь!';
    } else {
        resultTitle.textContent = 'Неплохо!';
        resultDetail.textContent = 'Огромный и чудесный мир музыки ждёт Вас!';
    }
}

function resetGame() {
    stopAudio();
    state.score = 0;
    state.currentIndex = 0;
    state.isAnswered = false;
    state.allQuestions = generateQuestions();

    scoreDisplay.textContent = '0';
    feedback.textContent = '';
    feedback.className = 'feedback';
    btnNext.style.display = 'none';

    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'none';
}

function startGame() {
    state.allQuestions = generateQuestions();
    state.score = 0;
    state.currentIndex = 0;

    startScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    loadQuestion(0);
}

// ============================================================
//  ОБРАБОТЧИКИ
// ============================================================
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', resetGame);
btnNext.addEventListener('click', goToNext);

document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', handleOptionClick);
});

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
resetGame();
console.log('Игра "Угадай композитора" загружена!');
console.log('В базе ' + COMPOSERS_DB.length + ' композиторов');