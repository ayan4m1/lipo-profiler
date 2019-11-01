import Chance from 'chance';
import moment from 'moment';
import { writeFile } from 'fs';

import loggers from './logging';

const log = loggers('app');

const iterations = 1;
const puffs = {
  count: 5,
  rampUp: 1000,
  duration: {
    mean: 3000,
    dev: 100
  },
  voltage: 3.87,
  wattage: {
    heating: 50,
    cooling: 35
  }
};
const idle = {
  duration: {
    mean: 5000,
    dev: 500
  }
};

const chance = new Chance();

const random = duration => chance.normal(duration);

const randomPuff = () => random(puffs.duration);
const randomIdle = () => random(idle.duration);

const formatTimestamp = (previousFrame, duration) => {
  const currentFrame = moment.duration(previousFrame, 'ms').add(duration, 'ms');
  const [hours, minutes, seconds] = [
    currentFrame.hours(),
    currentFrame
      .minutes()
      .toString()
      .padStart(2, '0'),
    currentFrame
      .seconds()
      .toString()
      .padStart(2, '0')
  ];

  return `${hours}:${minutes}:${seconds}`;
};

let serialNumber = 0;

const results = [];

const appendLogEntry = (time, voltage, wattage) => {
  results.push(`${serialNumber++},${time},${voltage},${wattage}`);
};

const execute = async () => {
  log.info('Started CSV generation...');

  const amps = {
    heating: (puffs.wattage.heating / puffs.voltage).toPrecision(2),
    cooling: (puffs.wattage.cooling / puffs.voltage).toPrecision(2)
  };

  for (let iteration = 1; iteration <= iterations; iteration++) {
    log.info(`Simulation iteration ${iteration}`);
    let iterationMs = 0;

    for (let puff = 0; puff < puffs.count; puff++) {
      log.info(`Simulation puff ${puff}`);

      const puffMs = randomPuff();
      const coolingMs = Math.max(0, puffMs - puffs.rampUp);
      const idleMs = randomIdle();

      const prePuff = formatTimestamp(iterationMs, 0);

      appendLogEntry(prePuff, puffs.voltage, amps.heating);

      if (coolingMs > 0) {
        const preCool = formatTimestamp(iterationMs, puffs.rampUp);

        appendLogEntry(preCool, puffs.voltage, amps.cooling);
      }

      const postPuff = formatTimestamp(iterationMs, puffMs + coolingMs);

      appendLogEntry(postPuff, puffs.voltage, 0);

      const frameMs = puffMs + coolingMs + idleMs;

      iterationMs += frameMs;
    }
  }

  writeFile(
    'output.csv',
    `Number,Time,Voltage,Current\n${results.join('\n')}`,
    'utf8',
    error => {
      if (error) {
        log.error(error.message, error);
      }
    }
  );
};

execute();
