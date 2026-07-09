// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Данные пользователя
let currentUser = {
    id: null,
    username: 'Гость',
    first_name: 'Игрок'
};

let currentBalance = 0;
let currentTab = 'games';

// Загрузка приложения
window.addEventListener('load', async () => {
    try {
        // Инициализируем Telegram
        tg.ready();
        
        // Получаем данные пользователя
        const initData = tg.initDataUnsafe;
        
        if (initData && initData.user) {
            currentUser.id = initData.user.id;
            currentUser.username = initData.user.username || 'Игрок';
            currentUser.first_name = initData.user.first_name || 'Игрок';
        }
        
        // Загружаем баланс с сервера
        await loadUserData();
        
        // Показываем интерфейс после загрузки
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'block';
            updateUserInfo();
            showTab('games');
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('loading-screen').innerHTML = 
            '<p style="color: white;">Ошибка загрузки. Попробуйте позже.</p>';
    }
});

// Загрузка данных пользователя с бота
async function loadUserData() {
    try {
        // Отправляем данные на сервер бота
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUser.id,
                username: currentUser.username,
                firstName: currentUser.first_name
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentBalance = data.balance || 0;
        }
    } catch (error) {
        console.log('Используем локальные данные');
        currentBalance = 100; // Тестовый баланс
    }
}

// Обновление информации о пользователе
function updateUserInfo() {
    document.getElementById('username').textContent = currentUser.first_name;
    document.getElementById('balance').textContent = `⭐ ${currentBalance}`;
}

// Переключение вкладок
function showTab(tab) {
    currentTab = tab;
    
    // Обновляем кнопки
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.nav-btn').classList.add('active');
    
    // Загружаем контент
    switch(tab) {
        case 'games':
            loadGamesTab();
            break;
        case 'leaderboard':
            loadLeaderboardTab();
            break;
        case 'instructions':
            loadInstructionsTab();
            break;
        case 'profile':
            loadProfileTab();
            break;
    }
}

// Вкладка Игры
function loadGamesTab() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <h2 style="margin-bottom: 20px;">🎮 Доступные игры</h2>
        <div class="games-grid">
            <div class="game-card" onclick="loadTicTacToe()">
                <span class="game-emoji">❌⭕</span>
                <h3>Крестики-Нолики</h3>
                <p class="game-desc">Классическая игра против друзей или бота</p>
                <span class="badge online">Онлайн</span>
            </div>
            
            <div class="game-card" onclick="loadDice()">
                <span class="game-emoji">🎲</span>
                <h3>Кубик</h3>
                <p class="game-desc">Брось 3 кубика и победи соперника</p>
                <span class="badge online">Онлайн</span>
            </div>
            
            <div class="game-card" onclick="loadCups()">
                <span class="game-emoji">🥤</span>
                <h3>Найди шарик</h3>
                <p class="game-desc">Угадай под каким стаканом шарик и получи x1.5</p>
                <span class="badge offline">Оффлайн</span>
            </div>
        </div>
    `;
}

// Вкладка Рейтинг
async function loadLeaderboardTab() {
    const content = document.getElementById('content-area');
    
    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();
        
        if (leaderboard.length === 0) {
            content.innerHTML = '<p style="text-align: center; padding: 50px; opacity: 0.6;">Пока нет данных 😔</p>';
            return;
        }
        
        content.innerHTML = `
            <h2 style="margin-bottom: 20px;">🏆 Топ игроков</h2>
            ${leaderboard.map((player, index) => `
                <div class="leaderboard-item fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="rank">${index + 1}</div>
                    <div class="avatar">👤</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${player.username || 'Игрок'}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                            Выиграно игр: ${player.wins || 0}
                        </div>
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">
                        +${player.profit || 0}⭐
                    </div>
                </div>
            `).join('')}
        `;
    } catch (error) {
        content.innerHTML = `
            <h2 style="margin-bottom: 20px;">🏆 Топ игроков</h2>
            <p style="text-align: center; opacity: 0.6;">Рейтинг временно недоступен</p>
        `;
    }
}

// Вкладка Инструкция
function loadInstructionsTab() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <h2 style="margin-bottom: 20px;">📖 Инструкция</h2>
        
        <div class="fade-in">
            <h3 style="color: #f093fb;">❌⭕ Крестики-Нолики</h3>
            <p style="margin: 10px 0; line-height: 1.6;">
                Классическая игра на поле 3x3. Игроки по очереди ставят крестики и нолики.
                Победитель забирает всю ставку. При ничьей ставка возвращается.
            </p>
            
            <h3 style="color: #f093fb; margin-top: 20px;">🎲 Кубик</h3>
            <p style="margin: 10px 0; line-height: 1.6;">
                Каждый игрок бросает по 3 кубика. У кого сумма выпавших чисел больше - 
                тот побеждает и забирает банк. При равной сумме - ничья.
            </p>
            
            <h3 style="color: #f093fb; margin-top: 20px;">🥤 Найди шарик</h3>
            <p style="margin: 10px 0; line-height: 1.6;">
                Под одним из трёх стаканов спрятан шарик. Стаканы быстро перемешиваются.
                Если угадаешь где шарик - получаешь x1.5 от своей ставки!
            </p>
            
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; margin-top: 20px;">
                <h4 style="color: #ffd700;">💰 Правила ставок:</h4>
                <ul style="list-style: none; padding: 0; margin-top: 10px;">
                    <li style="margin: 8px 0;">✅ Минимальная ставка: 1⭐</li>
                    <li style="margin: 8px 0;">✅ Максимальная ставка: 10000⭐</li>
                    <li style="margin: 8px 0;">✅ Комиссия бота: 5%</li>
                    <li style="margin: 8px 0;">🤖 При игре с ботом - бот играет оптимально</li>
                </ul>
            </div>
        </div>
    `;
}

// Вкладка Профиль
async function loadProfileTab() {
    const content = document.getElementById('content-area');
    
    try {
        const response = await fetch(`/api/stats/${currentUser.id}`);
        const stats = await response.json();
        
        content.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">👤</div>
                <h2>${currentUser.first_name}</h2>
                <p style="color: rgba(255,255,255,0.6);">@${currentUser.username}</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalGames || 0}</div>
                    <div class="stat-label">Всего игр</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalBet || 0}⭐</div>
                    <div class="stat-label">Поставлено</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="background: linear-gradient(45deg, #4CAF50, #8BC34A); -webkit-background-clip: text;">
                        ${stats.wins || 0}
                    </div>
                    <div class="stat-label">Побед</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="background: linear-gradient(45deg, #f44336, #ff5722); -webkit-background-clip: text;">
                        ${stats.losses || 0}
                    </div>
                    <div class="stat-label">Поражений</div>
                </div>
            </div>
            
            <h3 style="margin: 20px 0;">📊 Статистика по играм:</h3>
            
            <div class="stat-card" onclick="showGameStats('tictactoe')" style="cursor: pointer; margin: 10px 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 30px;">❌</span>
                <div>
                    <div style="font-weight: bold;">Крестики-Нолики</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Сыграно: ${stats.tictactoe || 0} игр</div>
                </div>
            </div>
            
            <div class="stat-card" onclick="showGameStats('dice')" style="cursor: pointer; margin: 10px 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 30px;">🎲</span>
                <div>
                    <div style="font-weight: bold;">Кубик</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Сыграно: ${stats.dice || 0} игр</div>
                </div>
            </div>
            
            <div class="stat-card" onclick="showGameStats('cups')" style="cursor: pointer; margin: 10px 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 30px;">🥤</span>
                <div>
                    <div style="font-weight: bold;">Найди шарик</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Сыграно: ${stats.cups || 0} игр</div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">👤</div>
                <h2>${currentUser.first_name}</h2>
            </div>
            <p style="text-align: center; opacity: 0.6;">Статистика временно недоступна</p>
        `;
    }
}

// Показать детальную статистику по игре
async function showGameStats(gameType) {
    const gameNames = {
        'tictactoe': 'Крестики-Нолики',
        'dice': 'Кубик',
        'cups': 'Найди шарик'
    };
    
    try {
        const response = await fetch(`/api/stats/${currentUser.id}/${gameType}`);
        const stats = await response.json();
        
        showModal(`
            <h3>📊 ${gameNames[gameType]}</h3>
            <div class="stats-grid" style="margin-top: 20px;">
                <div class="stat-card">
                    <div class="stat-value">${stats.gamesPlayed || 0}</div>
                    <div class="stat-label">Сыграно</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.gamesWon || 0}</div>
                    <div class="stat-label">Побед</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.gamesLost || 0}</div>
                    <div class="stat-label">Поражений</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalBet || 0}⭐</div>
                    <div class="stat-label">Поставлено</div>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <p>💰 Всего выиграно: <span style="color: #4CAF50; font-weight: bold;">${stats.totalWon || 0}⭐</span></p>
            </div>
        `);
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Модальное окно
function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Функция для форматирования чисел
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Обновление баланса (для тестирования)
function updateBalance(