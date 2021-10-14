require('dotenv').config();
const TuyAPI = require('tuyapi');
const sensor = require('node-dht-sensor').promises;
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const device = new TuyAPI({
  id: process.env.DEVICE_ID,
  key: process.env.DEVICE_KEY,
  issueGetOnConnect: false,
});

const INTERVAL = 300000;
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
    logger.info(`Current status: ${on}`);

    try {
      const res = await sensor.read(SENSOR_TYPE, PIN_LOCATION);
      const fTemp = res.temperature * (9 / 5) + 32;
      logger.info(
        `Temp: ${fTemp.toFixed(1)}°F\nHumidity: ${res.humidity.toFixed(1)}%`
      );
      if (fTemp > MAX_TEMP && on) {
        logger.info('cooling down');
        await device.set({ set: false });
      } else if (fTemp < MIN_TEMP && !on) {
        logger.info('heating up');
        await device.set({ set: true });
      }
    } catch (err) {
      logger.error(err);
    }
  } catch (err) {
    logger.error(err);
  } finally {
    logger.info('Disconnecting');
    device.disconnect();
  }
}

const startDate = new Date();
const endDate = new Date(new Date().getTime() + 60 * 60 * 1000 * 24);
logger.info(`Ending on ${endDate.toLocaleDateString()}`);
setInterval(async () => {
  if (startDate < endDate) {
    exec();
  } else {
    await connect();
    await device.set({ set: false });
  }
}, INTERVAL);
