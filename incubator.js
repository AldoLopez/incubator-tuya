require('dotenv').config();
const TuyAPI = require('tuyapi');
const sensor = require('node-dht-sensor').promises;

const device = new TuyAPI({
  id: process.env.DEVICE_ID,
  key: process.env.DEVICE_KEY,
  issueGetOnConnect: false,
});

async function exec() {
  try {
    await device.find();
    await device.connect();

    let status = await device.get();
    console.log(`Current status: ${status}`);

    try {
      const res = await sensor.read(22, 4);
      const fTemp = res.temperature * (9 / 5) + 32;
      console.log(
        `Temp: ${fTemp.toFixed(1)}°C\nHumidity: ${res.humidity.toFixed(1)}%`
      );
      if (fTemp > 60 && status) {
        console.log('cooling down');
        await device.set({ set: false });
      } else if (fTemp < 85 && !status) {
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
const endDate = new Date(new Date().getTime() + 60 * 60 * 1000 * 48);
console.log(`Ending on ${endDate.toISOString()}`);
setInterval(() => {
  if (startDate < endDate) {
    exec();
  }
}, 5000);
