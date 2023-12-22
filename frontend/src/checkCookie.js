export async function checkCookie(gameId) {
    let cookieValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_data\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    let email = '';
    let token = '';

    cookieValue = cookieValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');

    let userData;
    try {
        userData = JSON.parse(cookieValue);
    } catch (error) {
        console.error("Erreur lors de la conversion de la chaîne JSON :", error);
    }

    if (userData) {
        email = userData.email;
        token = userData.token;

        console.log("Email:", email);
        console.log("Token:", token);
    } else {
        console.error("Impossible de récupérer les données utilisateur depuis le cookie.");
    }

    if (email && token) {
        return await fetch('/api/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                token: token,
                gameId: gameId
            })
        }).then(response => response.json())
            .then(data => {
                console.log(data.sessionId);
                return data.sessionId;
            });
    }
}
