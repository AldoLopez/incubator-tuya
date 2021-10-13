require('dotenv').config();
const TuyAPI = require('tuyapi');
const sensor = require('node-dht-sensor').promises;

const device = new TuyAPI({
  id: process.env.DEVICE_ID,
  key: process.env.DEVICE_KEY,
  issueGetOnConnect: false,
});

const INTERVAL = 600000;
const MAX_TEMP = 98;
const MIN_TEMP = 80;
const SENSOR_TYPE = 22;
const PIN_LOCATION = 4;

async function connect() {
  await device.find();
  await device.connect();
}

async function exec() {
  try {
    await connect();
    let on = await device.get();
    console.log(`Current status: ${on}`);

    try {
      const res = await sensor.read(SENSOR_TYPE, PIN_LOCATION);
      const fTemp = res.temperature * (9 / 5) + 32;
      console.log(
        `Temp: ${fTemp.toFixed(1)}°F\nHumidity: ${res.humidity.toFixed(1)}%`
      );
      if (fTemp > MAX_TEMP && on) {
        console.log('cooling down');
        await device.set({ set: false });
      } else if (fTemp < MIN_TEMP && !on) {
        console.log('heating up');
        await device.set({ set: true });
      }
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  } finally {
    device.disconnect();
  }
}

const startDate = new Date();
const endDate = new Date(new Date().getTime() + 60 * 60 * 1000 * 24);
console.log(`Ending on ${endDate.toISOString()}`);
setInterval(async () => {
  if (startDate < endDate) {
    exec();
  } else {
    await connect();
    await device.set({ set: false });
  }
}, INTERVAL);
