// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ClaimTopicsRegistry is AccessControl {
    bytes32 public constant CLAIM_TOPICS_ADMIN_ROLE = keccak256("CLAIM_TOPICS_ADMIN_ROLE");

    uint256[] private claimTopics;
    mapping(uint256 topic => bool required) public isClaimTopicRequired;

    event ClaimTopicAdded(uint256 indexed topic, address indexed admin);
    event ClaimTopicRemoved(uint256 indexed topic, address indexed admin);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CLAIM_TOPICS_ADMIN_ROLE, admin);
    }

    function addClaimTopic(uint256 topic) external onlyRole(CLAIM_TOPICS_ADMIN_ROLE) {
        if (isClaimTopicRequired[topic]) {
            return;
        }

        isClaimTopicRequired[topic] = true;
        claimTopics.push(topic);
        emit ClaimTopicAdded(topic, msg.sender);
    }

    function removeClaimTopic(uint256 topic) external onlyRole(CLAIM_TOPICS_ADMIN_ROLE) {
        if (!isClaimTopicRequired[topic]) {
            return;
        }

        isClaimTopicRequired[topic] = false;

        for (uint256 index = 0; index < claimTopics.length; index++) {
            if (claimTopics[index] == topic) {
                claimTopics[index] = claimTopics[claimTopics.length - 1];
                claimTopics.pop();
                break;
            }
        }

        emit ClaimTopicRemoved(topic, msg.sender);
    }

    function getClaimTopics() external view returns (uint256[] memory) {
        return claimTopics;
    }
}
