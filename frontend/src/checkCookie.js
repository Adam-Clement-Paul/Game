export async function checkCookie (gameId) {
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
        console.error("Error while parsing to JSON.");
    }

    if (userData) {
        email = userData.email;
        token = userData.token;
    } else {
        console.error("Error while parsing cookie data.");
    }

    if (inventoryData) {
        backpackSkin = inventoryData.backpack._id;
        fighterSkin = inventoryData.fighter._id;
        truckSkin = inventoryData.truck._id;
    }

    // Create "Session" in backend to store player data (useful for websocket connection)
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
