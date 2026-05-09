// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {DealToken} from "./DealToken.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

contract OfferingController is AccessControl {
    bytes32 public constant OFFERING_OPERATOR_ROLE = keccak256("OFFERING_OPERATOR_ROLE");
    bytes32 public constant REGISTRAR_OPERATOR_ROLE = keccak256("REGISTRAR_OPERATOR_ROLE");

    DealToken public immutable dealToken;
    IdentityRegistry public immutable identityRegistry;

    event Minted(address indexed to, uint256 amount, bytes32 indexed offchainRef, address indexed operator);
    event ControlledTransferExecuted(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 indexed requestId,
        address operator
    );

    constructor(address admin, address dealToken_, address identityRegistry_) {
        require(dealToken_ != address(0), "OfferingController: zero token");
        require(identityRegistry_ != address(0), "OfferingController: zero identity registry");

        dealToken = DealToken(dealToken_);
        identityRegistry = IdentityRegistry(identityRegistry_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OFFERING_OPERATOR_ROLE, admin);
        _grantRole(REGISTRAR_OPERATOR_ROLE, admin);
    }

    function registerIdentity(address wallet, bytes32 identityId) external onlyRole(REGISTRAR_OPERATOR_ROLE) {
        identityRegistry.registerIdentity(wallet, identityId);
    }

    function addClaim(address wallet, uint256 topic, address issuer) external onlyRole(REGISTRAR_OPERATOR_ROLE) {
        identityRegistry.addClaim(wallet, topic, issuer);
    }

    function mintTo(address investor, uint256 amount, bytes32 offchainRef) external onlyRole(OFFERING_OPERATOR_ROLE) {
        dealToken.mint(investor, amount);
        emit Minted(investor, amount, offchainRef, msg.sender);
    }

    function controlledTransfer(
        address from,
        address to,
        uint256 amount,
        bytes32 requestId
    ) external onlyRole(OFFERING_OPERATOR_ROLE) {
        dealToken.controllerTransfer(from, to, amount);
        emit ControlledTransferExecuted(from, to, amount, requestId, msg.sender);
    }
}
