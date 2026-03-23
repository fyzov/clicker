let currentUser = null;

document.addEventListener('DOMContentLoaded', async function () {
    currentUser = await API.getCurrentUser();

    if (document.getElementById('click')) {
        await initGamePage();
    } else if (document.getElementById('username')) {
        await initAccountPage();
    } else if (document.getElementById('top-list')) {
        await initTopPage();
    } else if (document.getElementById('click-upgrade')) {
        await initUpgradePage();
    }

    const exitButton = document.getElementById('exit');
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }
});

async function initGamePage() {
    await updateScore();
    await updateClickMultiplier();

    const clickButton = document.getElementById('click');
    if (clickButton) {
        clickButton.addEventListener('click', handleClick);
    }
}

async function initAccountPage() {
    const usernameElement = document.getElementById('username');

    if (currentUser) {
        usernameElement.textContent = currentUser.name;

        const clickLevelElement = document.getElementById('click-level');
        const clickMultiplierElement = document.getElementById('click-multiplier');

        if (clickLevelElement) {
            clickLevelElement.textContent = currentUser.click_level;
        }
        if (clickMultiplierElement) {
            clickMultiplierElement.textContent = `x${currentUser.click_multiplier}`;
        }
    } else {
        usernameElement.textContent = 'Not logged in';
    }
}

async function initTopPage() {
    const topList = document.getElementById('top-list');
    const users = await API.getTopUsers();

    if (users.length > 0) {
        topList.innerHTML = '';
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user.name} - ${API.formatScore(user.score)} (x${user.click_multiplier} multiplier)`;
            topList.appendChild(li);
        });
    } else {
        topList.innerHTML = '<li>No players yet</li>';
    }
}

async function initUpgradePage() {
    await updateUpgradeButtons();

    setInterval(updateUpgradeButtons, 5000);
}

async function handleClick() {
    const result = await API.sendClick();

    if (result && result.success) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(result.score);
        }

        showFloatingPoints(result.points_earned);

        currentUser = await API.getCurrentUser();

        await updateClickMultiplier();
    }
}

async function updateScore() {
    const scoreData = await API.getUserScore();
    if (scoreData && scoreData.success) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(scoreData.score);
        }
    }
}

async function updateClickMultiplier() {
    const user = await API.getCurrentUser();
    if (user) {
        const clickMultiplierElement = document.getElementById('click-multiplier');
        if (clickMultiplierElement) {
            clickMultiplierElement.textContent = `x${user.click_multiplier}`;
        }
    }
}

async function updateUpgradeButtons() {
    const user = await API.getCurrentUser();
    if (!user) return;

    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = API.formatScore(user.score);
    }

    const clickUpgradeBtn = document.getElementById('click-upgrade');

    if (clickUpgradeBtn) {
        if (user.next_price === null) {
            clickUpgradeBtn.textContent = `MAX LEVEL REACHED! (Level ${user.click_level} | x${user.click_multiplier} multiplier)`;
            clickUpgradeBtn.disabled = true;
        } else {
            const nextMultiplier = 2 ** user.click_level;
            clickUpgradeBtn.textContent = `Upgrade: x${user.click_multiplier} → x${nextMultiplier} - ${API.formatScore(user.next_price)} points`;
            clickUpgradeBtn.disabled = user.score < user.next_price;
        }

        clickUpgradeBtn.replaceWith(clickUpgradeBtn.cloneNode(true));
        document.getElementById('click-upgrade').addEventListener('click', () => handleUpgrade('click'));
    }
}


async function handleUpgrade(upgradeType) {
    const result = await API.buyUpgrade(upgradeType);

    if (result.success) {
        showMessage(`Upgraded! Multiplier: x${result.click_multiplier} (Level ${result.click_level})`, 'success');

        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = API.formatScore(result.score);
        }

        await updateUpgradeButtons();
        currentUser = await API.getCurrentUser();
        await updateClickMultiplier();
    } else {
        showMessage(result.error || 'Failed to purchase upgrade', 'error');
    }
}

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

function showMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}
