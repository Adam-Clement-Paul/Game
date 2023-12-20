import QRCodeStyling from "qr-code-styling";

export function qrcode (gameId) {
    let display = false;
    const bottomCode = document.querySelector('#bottomCode');
    const qrSvg = document.querySelector('#qrSvg');
    const backSvg = document.querySelector('#backSvg');

    const qrcode = document.querySelector('#qrCode');
    const button = document.querySelector('#qrButton');
    const canvas = document.querySelector('#canvas');

    button.addEventListener('click', () => {
        if (display) {
            bottomCode.classList.remove('onQrCode');
            qrcode.style.display = 'none';

            qrSvg.style.display = 'block';
            backSvg.style.display = 'none';
            display = false;
        } else {
            bottomCode.classList.add('onQrCode');
            qrcode.style.display = 'block';

            qrSvg.style.display = 'none';
            backSvg.style.display = 'block';
            display = true;
        }
        button.blur();
    });

    const size = {
        width: window.innerWidth,
        height: window.innerHeight,
    }
    let qrWidth = size.width / 1.5;
    let qrHeight = size.height / 1.5;
    if (qrWidth > 300) {
        qrWidth = 300;
    }
    if (qrHeight > 300) {
        qrHeight = 300;
    }


    const qrCode = new QRCodeStyling({
        width: qrWidth,
        height: qrHeight,
        type: "svg",
        data: "http://localhost:3000/" + gameId,
        dotsOptions: {
            color: "#594141",
        },
        backgroundOptions: {
            color: "#ffffff00",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 20
        }
    });

    qrCode.append(canvas);
}
