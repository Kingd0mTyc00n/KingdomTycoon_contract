import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
 
export default buildModule('TestLordModule', (m) => {
  const deployer = m.getAccount(0);

  // Deploy - ignition will use network config gas settings
  const lord = m.contract('Lord', [deployer]);

  return { lord };
});
