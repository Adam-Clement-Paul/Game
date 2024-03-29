export async function checkCookie (gameId) {
    let cookieUserValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_data\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    let cookieInventoryValue = decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)user_inventory\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
    let email = '';
    let token = '';
    let backpackSkin = '';
    let fighterSkin = '';
    let truckSkin = '';

    let errorHandling = false;

    cookieUserValue = cookieUserValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');
    cookieInventoryValue = cookieInventoryValue.replace(/^%7B/, '{').replace(/%7D$/, '}').replace(/%22/g, '"');

    let userData;
    let inventoryData;
    try {
        userData = JSON.parse(cookieUserValue);
    } catch (error) {
        console.error("Error while parsing to JSON.");
        errorHandling = true;
    }

    try {
        inventoryData = JSON.parse(cookieInventoryValue);
    } catch (error) {
        console.error("Error while parsing inventory data.");
        // No need to handle this error, it's not a problem if the inventory is empty. It will be filled in backend.
    }

    if (userData) {
        email = userData.email;
        token = userData.token;
    } else {
        console.error("Error while parsing cookie data.");
        errorHandling = true;
    }

    if (inventoryData) {
        backpackSkin = inventoryData.backpack._id;
        fighterSkin = inventoryData.fighter._id;
        truckSkin = inventoryData.truck._id;
    }

    // Create "Session" in backend to store player data (useful for websocket connection)
    if (email && token && !errorHandling) {
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
            })
            .catch(error => {
                console.error(error);
                errorHandling = true;
            });
    }

    if (errorHandling) {
        window.location.href = 'https://pyrofighters.online';
    }
}
