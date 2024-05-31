

window.addEventListener("DOMContentLoaded", async() => {

    let devices = await navigator.hid.getDevices();

    console.log(devices);

    for (const device of devices) {
        console.log(`${device.productId}`);
    }

})