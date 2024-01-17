const joinButton = document.getElementById('join');
const joinGameError = document.getElementById('joinGameError');
const searchGamePopup = document.getElementById('searchGame');
const searchGameInput = document.querySelector('#searchGame > div');
const svg = document.querySelector('svg');

joinButton.addEventListener('click', () => {
    searchGamePopup.style.display = 'flex';
    document.getElementById('inputText').focus();

    document.addEventListener('click', clickOutsideHandler);
});

document.getElementById('joinForm').addEventListener('submit', function (event) {
    event.preventDefault();
    let gameId = document.getElementById('inputText').value.toLowerCase();

    if (gameId === '') {
        joinGameError.style.display = 'block';
        return;
    }

    // Parse the gameId to remove the / at the beginning
    // Because it causes Cross-Origin Request error
    gameId = gameId.replace('/', '');

    // Remove all characters that are not alphanumeric
    gameId = gameId.replace(/[^a-z0-9]/g, '');


    fetch(`/${gameId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        }
    })
        .then(response => {
            if (response.status === 200) {
                window.location.href = `/${gameId}`;
            } else {
                joinGameError.style.display = 'block';
            }
        })
        .catch(error => {
            console.error(error);
        });
});

document.getElementById('new').addEventListener('click', () => {
    fetch('/api/game', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.redirectUrl);
            window.location.href = data.redirectUrl;
        })
        .catch(error => {
            console.error(error);
        });
});

svg.addEventListener('click', () => {
    document.getElementById('submit').click();
});


// Function to close the search game field when clicking outside
function clickOutsideHandler (event) {
    if (!searchGameInput.contains(event.target) && event.target !== searchGameInput && event.target !== joinButton) {
        searchGamePopup.style.display = 'none';
        joinGameError.style.display = 'none';

        document.removeEventListener('click', clickOutsideHandler);
    }
}
