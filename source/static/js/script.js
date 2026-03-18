// Глобальные переменные
let currentUser = null;

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function () {
    // Загружаем информацию о пользователе
    currentUser = await API.getCurrentUser();

    // Инициализируем соответствующую страницу
    if (document.getElementById('click')) {
        await initGamePage();
    } else if (document.getElementById('username')) {
        await initAccountPage();
    } else if (document.getElementById('top-list')) {
        await initTopPage();
    } else if (document.getElementById('click-upgrade')) {
        await initUpgradePage();
    } else if (document.getElementById('login-form-element')) {
        initLoginPage();
    }

    // Общий обработчик для кнопки выхода
    const exitButton = document.getElementById('exit');
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }
});

// Инициализация игровой страницы
async function initGamePage() {
    await updateScore();

    const clickButton = document.getElementById('click');
    if (clickButton) {
        clickButton.addEventListener('click', handleClick);
    }
}

// Инициализация страницы аккаунта
async function initAccountPage() {
    const usernameElement = document.getElementById('username');

    if (currentUser) {
        usernameElement.textContent = currentUser.name;
    } else {
        usernameElement.textContent = 'Not logged in';
    }
}

// Инициализация страницы топа
async function initTopPage() {
    const topList = document.getElementById('top-list');
    const users = await API.getTopUsers();

    if (users.length > 0) {
        topList.innerHTML = '';
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user.name} - ${API.formatScore(user.score)}`;
            topList.appendChild(li);
        });
    } else {
        topList.innerHTML = '<li>No players yet</li>';
    }
}

// Инициализация страницы улучшений
async function initUpgradePage() {
    await updateUpgradeButtons();

    // Обновляем баланс каждые 5 секунд
    setInterval(updateUpgradeButtons, 5000);
}

// Инициализация страницы логина
function initLoginPage() {
    const loginForm = document.getElementById('login-form-element');
    const errorDiv = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username-input').value.trim();
        if (!username) return;

        const success = await API.login(username);
        if (!success) {
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

// Обработка клика
async function handleClick() {
    const result = await API.sendClick();

    if (result && result.success) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(result.score);
        }

        // Показываем всплывающие очки
        showFloatingPoints(result.points_earned);

        // Обновляем currentUser
        currentUser = await API.getCurrentUser();
    }
}

// Обновление счета
async function updateScore() {
    const scoreData = await API.getUserScore();
    if (scoreData && scoreData.success) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(scoreData.score);
        }
    }
}

// Обновление кнопок улучшений
async function updateUpgradeButtons() {
    const user = await API.getCurrentUser();
    if (!user) return;

    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = API.formatScore(user.score);
    }

    const clickUpgradeBtn = document.getElementById('click-upgrade');
    const secondUpgradeBtn = document.getElementById('second-upgrade');
    const boostBtn = document.getElementById('boost');

    const prices = {
        click: 12000000000,
        second: 1000000,
        boost: 1000000000000
    };

    if (clickUpgradeBtn) {
        clickUpgradeBtn.textContent = `Click upgrade +1 - ${API.formatScore(prices.click)} (Current: ${user.clicks})`;
        clickUpgradeBtn.disabled = user.score < prices.click;

        // Удаляем старый обработчик и добавляем новый
        clickUpgradeBtn.replaceWith(clickUpgradeBtn.cloneNode(true));
        document.getElementById('click-upgrade').addEventListener('click', () => handleUpgrade('click'));
    }

    if (secondUpgradeBtn) {
        secondUpgradeBtn.textContent = `Second upgrade +5 - ${API.formatScore(prices.second)}`;
        secondUpgradeBtn.disabled = user.score < prices.second;

        secondUpgradeBtn.replaceWith(secondUpgradeBtn.cloneNode(true));
        document.getElementById('second-upgrade').addEventListener('click', () => handleUpgrade('second'));
    }

    if (boostBtn) {
        if (user.boost) {
            boostBtn.textContent = 'x2 Boost - Purchased';
            boostBtn.disabled = true;
        } else {
            boostBtn.textContent = `x2 Boost - ${API.formatScore(prices.boost)}`;
            boostBtn.disabled = user.score < prices.boost;

            boostBtn.replaceWith(boostBtn.cloneNode(true));
            document.getElementById('boost').addEventListener('click', () => handleUpgrade('boost'));
        }
    }
}

// Обработка покупки улучшения
async function handleUpgrade(upgradeType) {
    const result = await API.buyUpgrade(upgradeType);

    if (result.success) {
        showMessage('Upgrade purchased successfully!', 'success');

        // Обновляем интерфейс
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(result.score);
        }

        await updateUpgradeButtons();
        currentUser = await API.getCurrentUser();
    } else {
        showMessage(result.error || 'Failed to purchase upgrade', 'error');
    }
}

// Всплывающие очки
function showFloatingPoints(points) {
    const pointsElement = document.createElement('div');
    pointsElement.className = 'floating-points';
    pointsElement.textContent = `+${points}`;

    const clickButton = document.getElementById('click');
    if (clickButton) {
        const rect = clickButton.getBoundingClientRect();
        pointsElement.style.left = rect.left + rect.width / 2 + 'px';
        pointsElement.style.top = rect.top + 'px';

        document.body.appendChild(pointsElement);

        setTimeout(() => {
            pointsElement.remove();
        }, 1000);
    }
}

// Показ сообщений
function showMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}
