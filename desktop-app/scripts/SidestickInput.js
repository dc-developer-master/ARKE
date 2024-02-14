

(async() => {

    let devices = await navigator.hid.requestDevice({ filters: [] });

    for (const device of devices) {
        console.log(`${device.productId}`);
    }

})