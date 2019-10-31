import cosmiconfig from 'cosmiconfig';

const configSearch = cosmiconfig('profile').searchSync();

if (configSearch === null) {
  throw new Error(
    'Did not find a config file for module name "profile" - see https://github.com/davidtheclark/cosmiconfig#explorersearch'
  );
}

export default configSearch.config;
