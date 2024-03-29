import Chance from 'chance';
import moment from 'moment';
import { writeFile } from 'fs';

import loggers from './logging.js';

const log = loggers('app');

const puffs = {
  count: 10,
  duration: {
    mean: 4500,
    dev: 1000
  },
  voltage: 14.8
};
const idle = {
  duration: {
    mean: 25000,
    dev: 10000
  }
};
const wattages = [
  {
    heating: 35,
    cooling: 20,
    rampUp: 1500
  },
  {
    heating: 75,
    cooling: 50,
    rampUp: 1000
  },
  {
    heating: 150,
    cooling: 75,
    rampUp: 750
  }
];

const chance = new Chance();

const random = (duration) => chance.normal(duration);

const randomPuff = () => random(puffs.duration);
const randomIdle = () => random(idle.duration);

const formatTimestamp = (previousFrame, duration) => {
  const currentFrame = moment.duration(previousFrame, 'ms').add(duration, 'ms');
  const [hours, minutes, seconds] = [
    currentFrame.hours(),
    currentFrame.minutes().toString().padStart(2, '0'),
    currentFrame.seconds().toString().padStart(2, '0')
  ];

  return `${hours}:${minutes}:${seconds}`;
};

const execute = async () => {
  log.info('Started CSV generation...');

  for (const wattage of wattages) {
    let serialNumber = 1;

    const createLogEntry = (time, voltage, amperage) =>
      `${serialNumber++},${time},${voltage},${amperage}`;

    const results = [];
    const { heating, cooling } = wattage;
    const amps = {
      heating: (heating / puffs.voltage).toPrecision(4),
      cooling: (cooling / puffs.voltage).toPrecision(4)
    };

    log.info(`Building profile for ${heating}W`);
    let iterationMs = 0;

    for (let puff = 0; puff < puffs.count; puff++) {
      const puffMs = randomPuff();
      const coolingMs = Math.max(0, puffMs - wattage.rampUp);
      const idleMs = randomIdle();

      const prePuff = formatTimestamp(iterationMs, 0);

      results.push(createLogEntry(prePuff, puffs.voltage, amps.heating));

      if (coolingMs > 0) {
        const preCool = formatTimestamp(iterationMs, wattage.rampUp);

        results.push(createLogEntry(preCool, puffs.voltage, amps.cooling));
      }

      const postPuff = formatTimestamp(iterationMs, puffMs + coolingMs);

      results.push(createLogEntry(postPuff, puffs.voltage, 0));

      const frameMs = puffMs + coolingMs + idleMs;

      iterationMs += frameMs;
    }

    writeFile(
      `profile-${wattage.heating}w.csv`,
      `Number,Time,Voltage,Current\n${results.join('\n')}\n`,
      'utf8',
      (error) => {
        if (error) {
          log.error(error.message, error);
        }
      }
    );
  }
};

execute();
