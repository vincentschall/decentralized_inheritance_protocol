import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
export default buildModule("Deploy", (m) => {
    const notaryAddress = m.getParameter("notaryAddress");
    const mockUSDC = m.contract("MockUSDC");
    const mockDeathOracle = m.contract("MockDeathOracle");
    const inheritanceProtocol = m.contract("InheritanceProtocol", [
        mockUSDC, mockDeathOracle, notaryAddress]);
    return {mockUSDC, mockDeathOracle, inheritanceProtocol};
});