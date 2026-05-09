// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Compliance} from "./Compliance.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

contract DealToken is ERC20, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    IdentityRegistry public immutable identityRegistry;
    Compliance public immutable compliance;

    event ControllerTransfer(address indexed from, address indexed to, uint256 amount, address indexed operator);

    constructor(
        address admin,
        string memory name_,
        string memory symbol_,
        address identityRegistry_,
        address compliance_
    ) ERC20(name_, symbol_) {
        require(identityRegistry_ != address(0), "DealToken: zero identity registry");
        require(compliance_ != address(0), "DealToken: zero compliance");

        identityRegistry = IdentityRegistry(identityRegistry_);
        compliance = Compliance(compliance_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function mint(address to, uint256 amount) external onlyRole(ISSUER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(ISSUER_ROLE) {
        _burn(from, amount);
    }

    function controllerTransfer(address from, address to, uint256 amount) external onlyRole(CONTROLLER_ROLE) {
        _transfer(from, to, amount);
        emit ControllerTransfer(from, to, amount, msg.sender);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (to != address(0)) {
            require(compliance.canTransfer(from, to, value), "DealToken: transfer blocked by compliance");
        }

        super._update(from, to, value);
    }
}
