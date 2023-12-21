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

// Récupère l'email et token du cookie nommé user_data après l'avoir parsé en JSON
const cookie = document.cookie.split('; ').find(row => row.startsWith('user_data'))?.split('=')[1];

// Fonction pour récupérer la valeur d'un cookie par son nom
function getCookieValue(cookieName) {
    var name = cookieName + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');

    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }

    return null;
}

var cookieValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_data\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
let email = '';
let token = '';

// Supprimer les caractères de pourcentage
cookieValue = cookieValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');

// Extraire les valeurs de l'objet JSON
var userData;
try {
    userData = JSON.parse(cookieValue);
} catch (error) {
    console.error("Erreur lors de la conversion de la chaîne JSON :", error);
}

// Accéder aux propriétés de l'objet userData
if (userData) {
    email = userData.email;
    token = userData.token;

    console.log("Email:", email);
    console.log("Token:", token);
} else {
    console.error("Impossible de récupérer les données utilisateur depuis le cookie.");
}

// Fais un post sur localhost:3000/api/game avec le token et l'email
// pour récupérer les parties en cours de l'utilisateur
if (email && token) {
    fetch('/api/game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            token: token
        })
    });
}
