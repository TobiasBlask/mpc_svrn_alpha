// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract TrustedIssuersRegistry is AccessControl {
    bytes32 public constant TRUSTED_ISSUER_ADMIN_ROLE = keccak256("TRUSTED_ISSUER_ADMIN_ROLE");

    mapping(address issuer => mapping(uint256 topic => bool trusted)) public canIssueTopic;

    event TrustedIssuerAdded(address indexed issuer, uint256 indexed topic, address indexed admin);
    event TrustedIssuerRemoved(address indexed issuer, uint256 indexed topic, address indexed admin);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TRUSTED_ISSUER_ADMIN_ROLE, admin);
    }

    function addTrustedIssuer(address issuer, uint256 topic) external onlyRole(TRUSTED_ISSUER_ADMIN_ROLE) {
        require(issuer != address(0), "TrustedIssuersRegistry: zero issuer");
        canIssueTopic[issuer][topic] = true;
        emit TrustedIssuerAdded(issuer, topic, msg.sender);
    }

    function removeTrustedIssuer(address issuer, uint256 topic) external onlyRole(TRUSTED_ISSUER_ADMIN_ROLE) {
        canIssueTopic[issuer][topic] = false;
        emit TrustedIssuerRemoved(issuer, topic, msg.sender);
    }
}
