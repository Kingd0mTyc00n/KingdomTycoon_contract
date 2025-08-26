import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
 
export default buildModule('LordModule', (m) => {
  const deployer = m.getAccount(0);

  const lord = m.contract('Lord', [deployer]);

  return { lord };
});