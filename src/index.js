import Chance from 'chance';

import loggers from './logging';
import moment from '../node_modules/moment/moment';

const log = loggers('app');

const iterations = 1;
const puffs = {
  count: 5,
  duration: {
    mean: 3000,
    dev: 100
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

  return `${currentFrame.hours()}:${currentFrame
    .minutes()
    .toString()
    .padStart(2, '0')}:${currentFrame
    .seconds()
    .toString()
    .padStart(2, '0')}`;
};

let serialNumber = 0;

const results = [];

const appendLogEntry = (time, voltage, wattage) => {
  results.push(`${serialNumber++},${time},${voltage},${wattage}`);
};

const execute = async () => {
  log.info('Started CSV generation...');

  for (let iteration = 1; iteration <= iterations; iteration++) {
    log.info(`Simulation iteration ${iteration}`);
    let iterationMs = 0;

    for (let puff = 0; puff < puffs.count; puff++) {
      log.info(`Simulation puff ${puff}`);

      const puffMs = randomPuff();
      const idleMs = randomIdle();

      const prePuff = formatTimestamp(iterationMs, 0);
      const postPuff = formatTimestamp(iterationMs, puffMs);
      const frameMs = puffMs + idleMs;

      appendLogEntry(prePuff, 14.8, 50);
      appendLogEntry(postPuff, 14.8, 0);

      iterationMs += frameMs;
    }
  }

  log.info(`\nNumber,Time,Voltage,Wattage\n${results.join('\n')}`);
};

execute();
