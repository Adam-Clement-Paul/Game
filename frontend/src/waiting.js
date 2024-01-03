let timer = 0;

export function waiting() {
    const title = document.querySelector('#bottomCode p');
    title.style.display = 'block';
    const titleText = title.textContent;
    let i = 0;

    function animateDots() {
        if (i < 3) {
            title.textContent += '.';
            i++;
        } else {
            title.textContent = titleText;
            i = 0;
        }
    }

    timer = setInterval(animateDots, 500);
}

export function stopWaiting() {
    clearInterval(timer);
}