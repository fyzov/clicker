// API клиент для взаимодействия с сервером
const API = {
    // Форматирование счета (теперь на клиенте)
    formatScore(score) {
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
    },

    // Получить информацию о текущем пользователе
    async getCurrentUser() {
        try {
            const response = await fetch('/api/user/info');
            const data = await response.json();
            return data.success ? data.user : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    // Получить счет пользователя
    async getUserScore() {
        try {
            const response = await fetch('/api/user/score');
            const data = await response.json();
            return data.success ? data : null;
        } catch (error) {
            console.error('Error loading score:', error);
            return null;
        }
    },

    // Отправить клик
    async sendClick() {
        try {
            const response = await fetch('/api/user/click', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data.success ? data : null;
        } catch (error) {
            console.error('Error handling click:', error);
            return null;
        }
    },

    // Купить улучшение
    async buyUpgrade(upgradeType) {
        try {
            const response = await fetch(`/api/user/upgrade/${upgradeType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error buying upgrade:', error);
            return { success: false, error: 'Network error' };
        }
    },

    // Получить топ пользователей
    async getTopUsers() {
        try {
            const response = await fetch('/api/top/users');
            const data = await response.json();
            return data.success ? data.users : [];
        } catch (error) {
            console.error('Error loading top users:', error);
            return [];
        }
    },

    // Войти в аккаунт
    async login(username) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}`
            });

            if (response.redirected) {
                window.location.href = response.url;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error logging in:', error);
            return false;
        }
    }
};
