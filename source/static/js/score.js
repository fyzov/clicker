const username = document.body.dataset.username;
const scoreElement = document.getElementById('score');

document.getElementById('clickButton').addEventListener('click', function () {
    fetch(`/update_score?username=${username}&clicks=1`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                scoreElement.textContent = data.new_score;
            }
        })
});
