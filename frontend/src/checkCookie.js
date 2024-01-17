export async function checkCookie(gameId) {
    let cookieUserValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_data\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    let cookieInventoryValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_inventory\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    let email = '';
    let token = '';
    let backpackSkin = '';
    let fighterSkin = '';
    let truckSkin = '';

    cookieUserValue = cookieUserValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');
    cookieInventoryValue = cookieInventoryValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');

    let userData;
    let inventoryData;
    try {
        userData = JSON.parse(cookieUserValue);
        inventoryData = JSON.parse(cookieInventoryValue);
    } catch (error) {
        console.error("Erreur lors de la conversion de la chaîne JSON :", error);
    }

    if (userData) {
        email = userData.email;
        token = userData.token;
    } else {
        console.error("Impossible de récupérer les données utilisateur depuis le cookie.");
    }

    if (inventoryData) {
        console.log(inventoryData);
        backpackSkin = inventoryData.backpack._id;
        fighterSkin = inventoryData.fighter._id;
        truckSkin = inventoryData.truck._id;
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
                gameId: gameId,
                backpack: backpackSkin,
                fighter: fighterSkin,
                truck: truckSkin
            })
        }).then(response => response.json())
            .then(data => {
                return data.sessionId;
            });
    }
}
