export type TemplateId = 'erc20' | 'erc721' | 'erc1155' | 'vault' | 'multisig' | 'crowdfunding';

export const TEMPLATES: Record<TemplateId, { fileName: string; label: string; description: string; code: (name: string, tokenName: string) => string }> = {
  erc20: {
    fileName: 'SolCoin.sol', label: 'ERC-20',
    description: 'Fixed-supply fungible token',
    code: (name, tokenName) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ${tokenName} — fixed-supply ERC-20
/// @notice Minted once to the deployer. No further minting possible.
/// @custom:voice "write an ERC-20 called ${tokenName} with a fixed supply of one million"
contract ${name} is ERC20, Ownable {
    error SupplyAlreadyFixed();

    /// @dev 1000000 tokens with 18 decimals = 1000000 * 10**18 base units.
    uint256 public constant FIXED_SUPPLY = 1000000 * 10**18; // one million tokens

    /// @notice Deploys and mints the full fixed supply to the deployer.
    constructor() ERC20("${tokenName}", "${name.toUpperCase()}") Ownable(msg.sender) {
        _mint(msg.sender, FIXED_SUPPLY);
    }
}
`,
  },
  erc721: {
    fileName: 'Collectible.sol', label: 'ERC-721',
    description: 'NFT collection with capped supply',
    code: (name) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ${name} NFT collection
/// @notice Capped-supply NFTs, owner-only minting.
contract ${name} is ERC721, Ownable {
    error MaxSupplyReached();
    error TokenDoesNotExist(uint256 tokenId);

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 private _nextId = 1;

    constructor() ERC721("${name}", "${name.toUpperCase().slice(0, 5)}") Ownable(msg.sender) {}

    /// @notice Mint one token to \`to\`. Reverts after MAX_SUPPLY.
    function mint(address to) external onlyOwner returns (uint256) {
        if (_nextId > MAX_SUPPLY) revert MaxSupplyReached();
        uint256 id = _nextId++;
        _safeMint(to, id);
        return id;
    }
}
`,
  },
  erc1155: {
    fileName: 'Items.sol', label: 'ERC-1155',
    description: 'Multi-token with per-id URIs',
    code: (name) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ${name} multi-token
contract ${name} is ERC1155, Ownable {
    error UnauthorizedMinter(address caller);

    constructor() ERC1155("https://example.com/meta/{id}.json") Ownable(msg.sender) {}

    /// @notice Mint \`amount\` of token \`id\` to \`to\`.
    function mint(address to, uint256 id, uint256 amount) external onlyOwner {
        _mint(to, id, amount, "");
    }
}
`,
  },
  vault: {
    fileName: 'Vault.sol', label: 'Vault',
    description: 'Simple ETH deposit vault',
    code: (name) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ${name} — simple ETH vault
/// @notice Deposit and withdraw ETH. No unbounded loops; pull pattern only.
contract ${name} {
    error InsufficientBalance(uint256 requested, uint256 available);
    error TransferFailed();

    mapping(address => uint256) public balances;

    /// @notice Deposit ETH into the vault.
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    /// @notice Withdraw \`amount\` wei. Uses checks-effects-interactions.
    function withdraw(uint256 amount) external {
        uint256 bal = balances[msg.sender];
        if (amount > bal) revert InsufficientBalance(amount, bal);
        balances[msg.sender] = bal - amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
`,
  },
  multisig: {
    fileName: 'Multisig.sol', label: 'Multisig',
    description: 'M-of-N approval wallet',
    code: (name) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ${name} — minimal M-of-N multisig
/// @notice Owners propose, confirm, and execute calls. Bounded owner set.
contract ${name} {
    error NotOwner();
    error AlreadyConfirmed();
    error QuorumNotReached();
    error ExecutionFailed();

    address[] public owners;
    uint256 public immutable quorum;
    mapping(address => bool) public isOwner;

    struct Proposal { address to; uint256 value; bytes data; uint256 confirmations; bool executed; mapping(address => bool) confirmedBy; }
    Proposal[] private _proposals;

    modifier onlyOwner() { if (!isOwner[msg.sender]) revert NotOwner(); _; }

    /// @param _owners Initial owner list (max 10). @param _quorum Required confirmations.
    constructor(address[] memory _owners, uint256 _quorum) {
        require(_owners.length > 0 && _owners.length <= 10, "bad owners");
        require(_quorum > 0 && _quorum <= _owners.length, "bad quorum");
        quorum = _quorum;
        for (uint256 i = 0; i < _owners.length; i++) {
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
        }
    }

    /// @notice Propose a call; proposer auto-confirms.
    function propose(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256 id) {
        id = _proposals.length;
        _proposals.push();
        Proposal storage p = _proposals[id];
        p.to = to; p.value = value; p.data = data; p.confirmations = 1;
        p.confirmedBy[msg.sender] = true;
    }

    /// @notice Confirm proposal \`id\`; executes at quorum.
    function confirm(uint256 id) external onlyOwner {
        Proposal storage p = _proposals[id];
        if (p.confirmedBy[msg.sender]) revert AlreadyConfirmed();
        p.confirmedBy[msg.sender] = true;
        p.confirmations += 1;
        if (p.confirmations >= quorum && !p.executed) {
            p.executed = true;
            (bool ok, ) = p.to.call{value: p.value}(p.data);
            if (!ok) revert ExecutionFailed();
        }
    }
}
`,
  },
  crowdfunding: {
    fileName: 'Crowdfund.sol', label: 'Crowdfunding',
    description: 'Goal + deadline campaign',
    code: (name) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ${name} — goal-based crowdfunding
/// @notice Contributors claim refunds if the goal is missed; owner withdraws on success.
contract ${name} {
    error CampaignClosed();
    error GoalNotReached();
    error GoalReachedNoRefund();
    error TransferFailed();

    address public immutable owner;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    uint256 public raised;
    mapping(address => uint256) public pledged;

    constructor(uint256 _goal, uint256 _durationSeconds) {
        owner = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _durationSeconds;
    }

    /// @notice Pledge ETH before the deadline.
    function pledge() external payable {
        if (block.timestamp > deadline) revert CampaignClosed();
        pledged[msg.sender] += msg.value;
        raised += msg.value;
    }

    /// @notice Owner withdraws after a successful campaign.
    function withdraw() external {
        if (msg.sender != owner || raised < goal) revert GoalNotReached();
        (bool ok, ) = owner.call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice Contributors reclaim funds if the goal was missed.
    function refund() external {
        if (raised >= goal) revert GoalReachedNoRefund();
        if (block.timestamp <= deadline) revert CampaignClosed();
        uint256 amt = pledged[msg.sender];
        pledged[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        if (!ok) revert TransferFailed();
    }
}
`,
  },
};
