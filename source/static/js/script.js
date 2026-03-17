async function getCurrentUser() {
    try {
        const response = await fetch('/api/user/info');
        const data = await response.json();
        return data.success ? data.user : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

async function loadUserScore() {
    try {
        const response = await fetch('/api/user/score');
        const data = await response.json();

        if (data.success) {
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = data.formatted_score;
            }
        }
    } catch (error) {
        console.error('Error loading score:', error);
    }
}

async function handleClick() {
    try {
        const response = await fetch('/api/user/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = data.formatted_score;
            }

            // Анимация получения очков
            showFloatingPoints(data.points_earned);
        }
    } catch (error) {
        console.error('Error handling click:', error);
    }
}

// Покупка улучшения
async function buyUpgrade(upgradeType) {
    try {
        const response = await fetch(`/api/user/upgrade/${upgradeType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Обновляем отображение счета
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = data.formatted_score;
            }

            showMessage('Upgrade purchased successfully!', 'success');
        } else {
            showMessage(data.error || 'Failed to purchase upgrade', 'error');
        }
    } catch (error) {
        console.error('Error buying upgrade:', error);
        showMessage('Error purchasing upgrade', 'error');
    }
}

// Загрузка топа пользователей
async function loadTopUsers() {
    try {
        const response = await fetch('/api/top/users');
        const data = await response.json();

        if (data.success) {
            const topList = document.querySelector('ol');
            if (topList) {
                topList.innerHTML = '';
                data.users.forEach((user, index) => {
                    const li = document.createElement('li');
                    li.textContent = `${user.name} - ${formatScore(user.score)}`;
                    topList.appendChild(li);
                });
            }
        }
    } catch (error) {
        console.error('Error loading top users:', error);
    }
}

// Обновление состояния кнопок улучшений
async function updateUpgradeButtons() {
    const user = await getCurrentUser();
    if (!user) return;

    const clickUpgradeBtn = document.getElementById('click-upgrade');
    const secondUpgradeBtn = document.getElementById('second-upgrade');
    const boostBtn = document.getElementById('boost');

    if (clickUpgradeBtn) {
        const price = 12000000000; // 12B
        clickUpgradeBtn.textContent = `Click upgrade +1 - ${formatScore(price)} (Current: ${user.clicks})`;
        clickUpgradeBtn.disabled = user.score < price;
    }

    if (secondUpgradeBtn) {
        const price = 1000000; // 1M
        secondUpgradeBtn.textContent = `Second upgrade +5 - ${formatScore(price)}`;
        secondUpgradeBtn.disabled = user.score < price;
    }

    if (boostBtn) {
        if (user.boost) {
            boostBtn.textContent = 'x2 Boost - Purchased';
            boostBtn.disabled = true;
        } else {
            const price = 1000000000000; // 1T
            boostBtn.textContent = `x2 Boost - ${formatScore(price)}`;
            boostBtn.disabled = user.score < price;
        }
    }
}



function showMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

function formatScore(score) {
    if (score >= 1000000000000) {
        return (score / 1000000000000).toFixed(1) + 'T';
    } else if (score >= 1000000000) {
        return (score / 1000000000).toFixed(1) + 'B';
    } else if (score >= 1000000) {
        return (score / 1000000).toFixed(1) + 'M';
    } else if (score >= 1000) {
        return (score / 1000).toFixed(1) + 'K';
    }
    return score.toString();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Загружаем счет если мы на главной странице
    if (document.getElementById('click')) {
        loadUserScore();

        // Добавляем обработчик клика
        const clickButton = document.getElementById('click');
        if (clickButton) {
            clickButton.addEventListener('click', handleClick);
        }
    }

    // Загружаем топ пользователей если мы на странице топа
    if (document.querySelector('ol')) {
        loadTopUsers();
    }

    // Обновляем состояние кнопок улучшений если мы на странице улучшений
    if (document.getElementById('click-upgrade')) {
        updateUpgradeButtons();

        // Добавляем обработчики для кнопок улучшений
        const clickUpgradeBtn = document.getElementById('click-upgrade');
        const secondUpgradeBtn = document.getElementById('second-upgrade');
        const boostBtn = document.getElementById('boost');

        if (clickUpgradeBtn) {
            clickUpgradeBtn.addEventListener('click', () => buyUpgrade('click'));
        }

        if (secondUpgradeBtn) {
            secondUpgradeBtn.addEventListener('click', () => buyUpgrade('second'));
        }

        if (boostBtn) {
            boostBtn.addEventListener('click', () => buyUpgrade('boost'));
        }
    }

    // Обработчик выхода из аккаунта
    const exitButton = document.getElementById('exit');
    if (exitButton) {
        exitButton.addEventListener('click', async () => {
            window.location.href = '/logout';
        });
    }
});
