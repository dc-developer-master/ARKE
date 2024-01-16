const hid = require('node-hid');

// Logitech Extreme 3D Pro's vendorID and productID: 1133:49685 (i.e. 046d:c215)
const device = new hid.HID(1133, 49685);

device.on('data', function (buf) {

    const ch = buf.toString('hex').match(/.{1,2}/g).map(function (c) {
        return parseInt(c, 16);
    });

    const controls = {
        roll: ((ch[1] & 0x03) << 8) + ch[0],
        pitch: ((ch[2] & 0x0f) << 6) + ((ch[1] & 0xfc) >> 2),
        yaw: ch[3],
        view: (ch[2] & 0xf0) >> 4,
        throttle: -ch[5] + 255,
        buttons: [
            (ch[4] & 0x01) >> 0,
            (ch[4] & 0x02) >> 1,
            (ch[4] & 0x04) >> 2,
            (ch[4] & 0x08) >> 3,
            (ch[4] & 0x10) >> 4,
            (ch[4] & 0x20) >> 5,
            (ch[4] & 0x40) >> 6,
            (ch[4] & 0x80) >> 7,

            (ch[6] & 0x01) >> 0,
            (ch[6] & 0x02) >> 1,
            (ch[6] & 0x04) >> 2,
            (ch[6] & 0x08) >> 3
        ]
    };

    console.log(JSON.stringify(controls));
});