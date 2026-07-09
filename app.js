// === КОНФИГУРАЦИЯ ===
const API_URL = 'http://de1.bot-hosting.net:21117';

// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Данные пользователя
let currentUser = {
    id: tg.initDataUnsafe?.user?.id || 1,
    username: tg.initDataUnsafe?.user?.username || 'Игрок',
    first_name: tg.initDataUnsafe?.user?.first_name || 'Игрок'
};

let currentBalance = 0;

// === ЗАГРУЗКА ===
window.addEventListener('load', async () => {
    await loadUserData();
    
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
        updateUserInfo();
        showTab('games');
    }, 2000);
});

// === API ===
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(API_URL + endpoint, options);
        return await response.json();
    } catch (error) {
        console.log('API Error:', error);
        return null;
    }
}

async function loadUserData() {
    const data = await apiRequest('/api/user', 'POST', {
        userId: currentUser.id,
        username: currentUser.username,
        firstName: currentUser.first_name
    });
    
    if (data) {
        currentBalance = data.balance || 0;
    } else {
        currentBalance = 100; // Тестовый баланс
    }
}

function updateUserInfo() {
    document.getElementById('username').textContent = currentUser.first_name;
    document.getElementById('balance').textContent = `⭐ ${currentBalance}`;
}

// === НАВИГАЦИЯ ===
function showTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.nav-btn').classList.add('active');
    
    switch(tab) {
        case 'games': loadGamesTab(); break;
        case 'leaderboard': loadLeaderboardTab(); break;
        case 'instructions': loadInstructionsTab(); break;
        case 'profile': loadProfileTab(); break;
    }
}

// === ВКЛАДКА ИГРЫ ===
function loadGamesTab() {
    document.getElementById('content-area').innerHTML = `
        <h2 style="margin-bottom:20px;">🎮 Игры</h2>
        <div class="games-grid">
            <div class="game-card" onclick="startTicTacToe()">
                <span class="game-emoji">❌⭕</span>
                <h3>Крестики-Нолики</h3>
                <p class="game-desc">Играйте против бота!</p>
                <span class="badge offline">Оффлайн</span>
            </div>
            <div class="game-card" onclick="startDice()">
                <span class="game-emoji">🎲</span>
                <h3>Кубик</h3>
                <p class="game-desc">Брось кубики против бота!</p>
                <span class="badge offline">Оффлайн</span>
            </div>
            <div class="game-card" onclick="startCups()">
                <span class="game-emoji">🥤</span>
                <h3>Найди шарик</h3>
                <p class="game-desc">Угадай и получи x1.5!</p>
                <span class="badge offline">Оффлайн</span>
            </div>
        </div>
    `;
}

// === КРЕСТИКИ-НОЛИКИ ===
let tttBoard = [];
let tttPlayer = 'X';
let tttBot = 'O';
let tttGameOver = false;
let tttBet = 0;

function startTicTacToe() {
    const bet = prompt('Введите ставку (звёзды):');
    if (!bet || isNaN(bet) || parseInt(bet) < 1) {
        alert('Введите корректную ставку!');
        return;
    }
    
    tttBet = parseInt(bet);
    
    if (tttBet > currentBalance) {
        alert('Недостаточно звёзд!');
        return;
    }
    
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameOver = false;
    
    renderTicTacToe();
}

function renderTicTacToe() {
    document.getElementById('content-area').innerHTML = `
        <h2>❌⭕ Крестики-Нолики</h2>
        <p style="text-align:center;margin:10px 0;">Ставка: ${tttBet}⭐ | Вы: ❌ Бот: ⭕</p>
        <div class="game-board">
            ${tttBoard.map((cell, i) => `
                <div class="cell ${cell}" onclick="${!tttGameOver && cell === '' ? `tttMove(${i})` : ''}">
                    ${cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
                </div>
            `).join('')}
        </div>
        ${tttGameOver ? '<button class="btn" onclick="loadGamesTab()" style="width:100%;margin-top:20px;">Назад к играм</button>' : ''}
    `;
}

function tttMove(index) {
    if (tttBoard[index] !== '' || tttGameOver) return;
    
    tttBoard[index] = 'X';
    renderTicTacToe();
    
    if (checkTTTWin('X')) {
        tttGameOver = true;
        currentBalance += tttBet;
        updateUserInfo();
        alert('🎉 Вы выиграли ' + (tttBet) + '⭐!');
        updateBalanceDB(tttBet);
        renderTicTacToe();
        return;
    }
    
    if (tttBoard.every(cell => cell !== '')) {
        tttGameOver = true;
        alert('Ничья!');
        renderTicTacToe();
        return;
    }
    
    // Ход бота
    setTimeout(() => {
        tttBotMove();
        renderTicTacToe();
        
        if (checkTTTWin('O')) {
            tttGameOver = true;
            currentBalance -= tttBet;
            updateUserInfo();
            alert('😢 Бот выиграл!');
            updateBalanceDB(-tttBet);
            renderTicTacToe();
            return;
        }
        
        if (tttBoard.every(cell => cell !== '')) {
            tttGameOver = true;
            alert('Ничья!');
            renderTicTacToe();
        }
    }, 500);
}

function tttBotMove() {
    // Бот играет умно
    const emptyCells = tttBoard.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
    
    // Проверка победы бота
    for (const i of emptyCells) {
        tttBoard[i] = 'O';
        if (checkTTTWin('O')) return;
        tttBoard[i] = '';
    }
    
    // Блокировка игрока
    for (const i of emptyCells) {
        tttBoard[i] = 'X';
        if (checkTTTWin('X')) {
            tttBoard[i] = 'O';
            return;
        }
        tttBoard[i] = '';
    }
    
    // Центр
    if (tttBoard[4] === '') {
        tttBoard[4] = 'O';
        return;
    }
    
    // Случайная клетка
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    tttBoard[randomIndex] = 'O';
}

function checkTTTWin(player) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return wins.some(w => w.every(i => tttBoard[i] === player));
}

// === КУБИК ===
function startDice() {
    const bet = prompt('Введите ставку (звёзды):');
    if (!bet || isNaN(bet) || parseInt(bet) < 1) {
        alert('Введите корректную ставку!');
        return;
    }
    
    const betAmount = parseInt(bet);
    
    if (betAmount > currentBalance) {
        alert('Недостаточно звёзд!');
        return;
    }
    
    // Бросок игрока
    const myDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    const mySum = myDice.reduce((a,b) => a+b, 0);
    
    // Бросок бота
    const botDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    const botSum = botDice.reduce((a,b) => a+b, 0);
    
    let result = '';
    if (mySum > botSum) {
        result = '🎉 Вы выиграли!';
        currentBalance += betAmount;
    } else if (mySum < botSum) {
        result = '😢 Бот выиграл!';
        currentBalance -= betAmount;
    } else {
        result = '🤝 Ничья!';
    }
    
    updateUserInfo();
    
    document.getElementById('content-area').innerHTML = `
        <h2>🎲 Кубик</h2>
        <p style="text-align:center;">Ставка: ${betAmount}⭐</p>
        
        <div style="text-align:center;margin:20px 0;">
            <h3>Ваши кубики:</h3>
            <div class="dice-container">
                ${myDice.map(d => `<span class="dice">${['','⚀','⚁','⚂','⚃','⚄','⚅'][d]}</span>`).join('')}
            </div>
            <p>Сумма: ${mySum}</p>
        </div>
        
        <div style="text-align:center;margin:20px 0;">
            <h3>Кубики бота:</h3>
            <div class="dice-container">
                ${botDice.map(d => `<span class="dice">${['','⚀','⚁','⚂','⚃','⚄','⚅'][d]}</span>`).join('')}
            </div>
            <p>Сумма: ${botSum}</p>
        </div>
        
        <h2 style="text-align:center;color:${mySum > botSum ? '#4CAF50' : '#f44336'}">${result}</h2>
        
        <button class="btn" onclick="startDice()" style="width:100%;margin-top:20px;">🎲 Играть ещё</button>
        <button class="btn" onclick="loadGamesTab()" style="width:100%;margin-top:10px;background:gray;">Назад</button>
    `;
}

// === СТАКАНЫ ===
let cupsGame = {
    ballPosition: 0,
    shuffled: false,
    chosen: false,
    bet: 0
};

function startCups() {
    const bet = prompt('Введите ставку (звёзды):');
    if (!bet || isNaN(bet) || parseInt(bet) < 1) {
        alert('Введите корректную ставку!');
        return;
    }
    
    cupsGame.bet = parseInt(bet);
    
    if (cupsGame.bet > currentBalance) {
        alert('Недостаточно звёзд!');
        return;
    }
    
    cupsGame.ballPosition = Math.floor(Math.random() * 3);
    cupsGame.shuffled = false;
    cupsGame.chosen = false;
    
    renderCups('shuffling');
    
    // Анимация перемешивания
    setTimeout(() => {
        cupsGame.shuffled = true;
        renderCups('choose');
    }, 2000);
}

function renderCups(phase) {
    const cupEmojis = ['🥤', '🥤', '🥤'];
    
    if (phase === 'result') {
        cupEmojis[cupsGame.ballPosition] = '🏆';
    }
    
    document.getElementById('content-area').innerHTML = `
        <h2>🥤 Найди шарик</h2>
        <p style="text-align:center;">Ставка: ${cupsGame.bet}⭐ | Выигрыш: ${Math.floor(cupsGame.bet * 1.5)}⭐</p>
        
        ${phase === 'shuffling' ? '<p style="text-align:center;color:#ffd700;">🔄 Перемешиваем...</p>' : ''}
        ${phase === 'choose' ? '<p style="text-align:center;color:#4CAF50;">👉 Выберите стакан!</p>' : ''}
        
        <div class="cups-container">
            ${cupEmojis.map((cup, i) => `
                <div class="cup ${phase === 'shuffling' ? 'shuffling' : ''}" 
                     onclick="${phase === 'choose' ? `chooseCup(${i})` : ''}"
                     style="font-size:80px;cursor:${phase === 'choose' ? 'pointer' : 'default'};">
                    ${cup}
                </div>
            `).join('')}
        </div>
        
        ${phase === 'result' ? `<button class="btn" onclick="startCups()" style="width:100%;margin-top:20px;">Играть ещё</button>` : ''}
        <button class="btn" onclick="loadGamesTab()" style="width:100%;margin-top:10px;background:gray;">Назад</button>
    `;
}

function chooseCup(index) {
    if (!cupsGame.shuffled || cupsGame.chosen) return;
    
    cupsGame.chosen = true;
    const won = index === cupsGame.ballPosition;
    
    if (won) {
        const winnings = Math.floor(cupsGame.bet * 1.5);
        currentBalance += winnings;
        alert('🎉 Вы выиграли ' + winnings + '⭐!');
    } else {
        currentBalance -= cupsGame.bet;
        alert('😢 Не угадали! Шарик был в стакане #' + (cupsGame.ballPosition + 1));
    }
    
    updateUserInfo();
    renderCups('result');
}

// === РЕЙТИНГ ===
async function loadLeaderboardTab() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<h2>🏆 Рейтинг</h2><p style="text-align:center;padding:50px;">Загрузка...</p>';
    
    const data = await apiRequest('/api/leaderboard');
    
    if (!data || data.length === 0) {
        content.innerHTML = '<h2>🏆 Рейтинг</h2><p style="text-align:center;padding:50px;">Пока нет данных</p>';
        return;
    }
    
    content.innerHTML = `
        <h2>🏆 Топ игроков</h2>
        ${data.map((p, i) => `
            <div class="leaderboard-item">
                <div class="rank">${i+1}</div>
                <div class="avatar">👤</div>
                <div style="flex:1">
                    <div style="font-weight:bold">${p.username}</div>
                    <div style="font-size:12px;opacity:0.6">Побед: ${p.wins}</div>
                </div>
                <div style="color:#4CAF50;font-weight:bold">+${p.profit}⭐</div>
            </div>
        `).join('')}
    `;
}

// === ИНСТРУКЦИЯ ===
function loadInstructionsTab() {
    document.getElementById('content-area').innerHTML = `
        <h2>📖 Инструкция</h2>
        <div style="line-height:1.8;">
            <h3>❌⭕ Крестики-Нолики</h3>
            <p>Играйте против бота. Победитель забирает ставку!</p>
            
            <h3>🎲 Кубик</h3>
            <p>Вы и бот бросаете по 3 кубика. У кого сумма больше - победил!</p>
            
            <h3>🥤 Найди шарик</h3>
            <p>Угадайте под каким стаканом шарик и получите x1.5 от ставки!</p>
        </div>
    `;
}

// === ПРОФИЛЬ ===
async function loadProfileTab() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<h2>👤 Профиль</h2><p style="text-align:center;">Загрузка...</p>';
    
    const stats = await apiRequest('/api/stats/' + currentUser.id);
    
    if (!stats) {
        content.innerHTML = '<h2>👤 Профиль</h2><p style="text-align:center;">Недоступно</p>';
        return;
    }
    
    content.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">👤</div>
            <h2>${currentUser.first_name}</h2>
            <p>@${currentUser.username}</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.totalGames}</div>
                <div class="stat-label">Всего игр</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalBet}⭐</div>
                <div class="stat-label">Поставлено</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color:#4CAF50">${stats.wins}</div>
                <div class="stat-label">Побед</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color:#f44336">${stats.losses}</div>
                <div class="stat-label">Поражений</div>
            </div>
        </div>
    `;
}

// Обновление баланса в БД
async function updateBalanceDB(amount) {
    await apiRequest('/api/updateBalance', 'POST', {
        userId: currentUser.id,
        amount: amount
    });
}
