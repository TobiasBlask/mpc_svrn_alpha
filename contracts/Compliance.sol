// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

contract Compliance is AccessControl {
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");

    IdentityRegistry public immutable identityRegistry;
    bool public paused;
    mapping(address wallet => bool frozen) public isFrozen;

    event CompliancePaused(bool paused, address indexed admin);
    event AddressFrozen(address indexed wallet, bool frozen, address indexed admin);

    constructor(address admin, address identityRegistry_) {
        require(identityRegistry_ != address(0), "Compliance: zero identity registry");

        identityRegistry = IdentityRegistry(identityRegistry_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ADMIN_ROLE, admin);
    }

    function setPaused(bool paused_) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        paused = paused_;
        emit CompliancePaused(paused_, msg.sender);
    }

    function setFrozen(address wallet, bool frozen) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        isFrozen[wallet] = frozen;
        emit AddressFrozen(wallet, frozen, msg.sender);
    }

    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        if (paused || amount == 0) {
            return false;
        }

        if (from != address(0) && (isFrozen[from] || !identityRegistry.isVerified(from))) {
            return false;
        }

        if (to != address(0) && (isFrozen[to] || !identityRegistry.isVerified(to))) {
            return false;
        }

        return true;
    }
}
