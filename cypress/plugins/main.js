import {handleGamePlayMessage} from '../../index';

export default function (on, config) {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    handleGamePlayMessage (message) {
      handleGamePlayMessage(message);
      return null;
    }
  })
}
