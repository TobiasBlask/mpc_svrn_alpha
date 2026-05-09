// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ClaimTopicsRegistry} from "./ClaimTopicsRegistry.sol";
import {TrustedIssuersRegistry} from "./TrustedIssuersRegistry.sol";

contract IdentityRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant CLAIM_ISSUER_ROLE = keccak256("CLAIM_ISSUER_ROLE");

    ClaimTopicsRegistry public immutable claimTopicsRegistry;
    TrustedIssuersRegistry public immutable trustedIssuersRegistry;

    mapping(address wallet => bytes32 identityId) public identityOf;
    mapping(address wallet => mapping(uint256 topic => address issuer)) public claimIssuerOf;

    event IdentityRegistered(address indexed wallet, bytes32 indexed identityId, address indexed registrar);
    event IdentityRemoved(address indexed wallet, address indexed registrar);
    event ClaimAdded(address indexed wallet, uint256 indexed topic, address indexed issuer);
    event ClaimRemoved(address indexed wallet, uint256 indexed topic, address indexed issuer);

    constructor(address admin, address claimTopicsRegistry_, address trustedIssuersRegistry_) {
        require(claimTopicsRegistry_ != address(0), "IdentityRegistry: zero topics registry");
        require(trustedIssuersRegistry_ != address(0), "IdentityRegistry: zero issuers registry");

        claimTopicsRegistry = ClaimTopicsRegistry(claimTopicsRegistry_);
        trustedIssuersRegistry = TrustedIssuersRegistry(trustedIssuersRegistry_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
        _grantRole(CLAIM_ISSUER_ROLE, admin);
    }

    function registerIdentity(address wallet, bytes32 identityId) external onlyRole(REGISTRAR_ROLE) {
        require(wallet != address(0), "IdentityRegistry: zero wallet");
        require(identityId != bytes32(0), "IdentityRegistry: empty identity");

        identityOf[wallet] = identityId;
        emit IdentityRegistered(wallet, identityId, msg.sender);
    }

    function deleteIdentity(address wallet) external onlyRole(REGISTRAR_ROLE) {
        delete identityOf[wallet];
        emit IdentityRemoved(wallet, msg.sender);
    }

    function addClaim(address wallet, uint256 topic, address issuer) external onlyRole(CLAIM_ISSUER_ROLE) {
        require(identityOf[wallet] != bytes32(0), "IdentityRegistry: wallet not registered");
        require(trustedIssuersRegistry.canIssueTopic(issuer, topic), "IdentityRegistry: untrusted issuer");

        claimIssuerOf[wallet][topic] = issuer;
        emit ClaimAdded(wallet, topic, issuer);
    }

    function removeClaim(address wallet, uint256 topic) external onlyRole(CLAIM_ISSUER_ROLE) {
        address issuer = claimIssuerOf[wallet][topic];
        delete claimIssuerOf[wallet][topic];
        emit ClaimRemoved(wallet, topic, issuer);
    }

    function isVerified(address wallet) public view returns (bool) {
        if (identityOf[wallet] == bytes32(0)) {
            return false;
        }

        uint256[] memory requiredTopics = claimTopicsRegistry.getClaimTopics();
        for (uint256 index = 0; index < requiredTopics.length; index++) {
            uint256 topic = requiredTopics[index];
            address issuer = claimIssuerOf[wallet][topic];

            if (issuer == address(0) || !trustedIssuersRegistry.canIssueTopic(issuer, topic)) {
                return false;
            }
        }

        return true;
    }
}
