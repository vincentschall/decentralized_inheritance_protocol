import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
export default buildModule("Deploy", (m) => {
    const notaryAddress = m.getParameter("notaryAddress");
    const mockUSDC = m.contract("MockUSDC");
    const mockDeathOracle = m.contract("MockDeathOracle");
    const mockAavePool = m.contract("MockAavePool", [mockUSDC]);
    const inheritanceProtocol = m.contract("InheritanceProtocol", [
        mockUSDC, mockDeathOracle, notaryAddress, mockAavePool
    ]);
    return {mockUSDC, mockDeathOracle, mockAavePool, inheritanceProtocol};
});