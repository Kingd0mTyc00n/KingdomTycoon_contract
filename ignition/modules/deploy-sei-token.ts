import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
 
export default buildModule('SeiTokenModule', (m) => {
  const deployer = m.getAccount(0);
 
  const seiToken = m.contract('Lord', [deployer]);
 
  return { seiToken };
});