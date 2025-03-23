// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title AI Turing Arena Game Contract
 * @dev Smart contract for managing the AI Turing Arena game on zkSync Sepolia testnet
 */
contract TuringArena {
    // Game status enum
    enum GameStatus { NotStarted, InProgress, Completed }
    
    // Game struct
    struct Game {
        uint256 id;
        uint256 entryFee;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        address[] players;
        address aiPlayer;
        address[] correctVoters;
        GameStatus status;
        mapping(address => bool) hasVoted;
        mapping(address => address) votes;
    }
    
    // Contract state variables
    uint256 public gameIdCounter;
    uint256 public protocolFeePercent; // in basis points (e.g., 1500 = 15%)
    address public owner;
    mapping(uint256 => Game) public games;
    
    // Events
    event GameCreated(uint256 indexed gameId, uint256 entryFee);
    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event AIPlayerSet(uint256 indexed gameId, address indexed aiPlayer);
    event GameStarted(uint256 indexed gameId, uint256 startTime);
    event VoteCast(uint256 indexed gameId, address indexed voter, address indexed votedFor);
    event GameCompleted(uint256 indexed gameId, address[] winners, uint256 prizePerWinner);
    event ProtocolFeeUpdated(uint256 newFeePercent);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier gameExists(uint256 _gameId) {
        require(_gameId < gameIdCounter, "Game does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        protocolFeePercent = 1500; // 15% by default
        gameIdCounter = 0;
    }
    
    /**
     * @dev Create a new game
     * @param _entryFee The fee to join the game in USDC (or other stablecoin)
     */
    function createGame(uint256 _entryFee) external onlyOwner {
        uint256 gameId = gameIdCounter;
        Game storage newGame = games[gameId];
        
        newGame.id = gameId;
        newGame.entryFee = _entryFee;
        newGame.status = GameStatus.NotStarted;
        
        gameIdCounter++;
        
        emit GameCreated(gameId, _entryFee);
    }
    
    /**
     * @dev Join a game by paying the entry fee
     * @param _gameId The ID of the game to join
     */
    function joinGame(uint256 _gameId) external payable gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.NotStarted, "Game already started");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        
        // Check if player already joined
        for (uint i = 0; i < game.players.length; i++) {
            require(game.players[i] != msg.sender, "Already joined this game");
        }
        
        // Add player to the game
        game.players.push(msg.sender);
        game.prizePool += msg.value;
        
        emit PlayerJoined(_gameId, msg.sender);
    }
    
    /**
     * @dev Set the AI player for a game (only owner)
     * @param _gameId The ID of the game
     * @param _aiPlayer The address representing the AI player
     */
    function setAIPlayer(uint256 _gameId, address _aiPlayer) external onlyOwner gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.NotStarted, "Game already started");
        
        game.aiPlayer = _aiPlayer;
        
        emit AIPlayerSet(_gameId, _aiPlayer);
    }
    
    /**
     * @dev Start a game (only owner)
     * @param _gameId The ID of the game to start
     * @param _duration The duration of the game in seconds
     */
    function startGame(uint256 _gameId, uint256 _duration) external onlyOwner gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.NotStarted, "Game already started");
        require(game.players.length >= 2, "Not enough players");
        require(game.aiPlayer != address(0), "AI player not set");
        
        game.status = GameStatus.InProgress;
        game.startTime = block.timestamp;
        game.endTime = block.timestamp + _duration;
        
        emit GameStarted(_gameId, block.timestamp);
    }
    
    /**
     * @dev Cast a vote for who you think is the AI
     * @param _gameId The ID of the game
     * @param _votedFor The address of the player voted for
     */
    function castVote(uint256 _gameId, address _votedFor) external gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.InProgress, "Game not in progress");
        require(block.timestamp <= game.endTime, "Voting period ended");
        
        // Check if player is in the game
        bool isPlayer = false;
        for (uint i = 0; i < game.players.length; i++) {
            if (game.players[i] == msg.sender) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Not a player in this game");
        
        // Check if player already voted
        require(!game.hasVoted[msg.sender], "Already voted");
        
        // Record the vote
        game.votes[msg.sender] = _votedFor;
        game.hasVoted[msg.sender] = true;
        
        emit VoteCast(_gameId, msg.sender, _votedFor);
    }
    
    /**
     * @dev End a game and distribute prizes
     * @param _gameId The ID of the game to end
     */
    function endGame(uint256 _gameId) external onlyOwner gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.InProgress, "Game not in progress");
        require(block.timestamp >= game.endTime, "Game not yet ended");
        
        // Find correct voters
        for (uint i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            if (game.hasVoted[player] && game.votes[player] == game.aiPlayer) {
                game.correctVoters.push(player);
            }
        }
        
        // Calculate prizes
        uint256 protocolFee = (game.prizePool * protocolFeePercent) / 10000;
        uint256 remainingPrize = game.prizePool - protocolFee;
        
        // If no one guessed correctly, AI player (contract owner) gets the prize
        if (game.correctVoters.length == 0) {
            payable(owner).transfer(remainingPrize);
        } else {
            // Split prize among correct voters
            uint256 prizePerWinner = remainingPrize / game.correctVoters.length;
            
            for (uint i = 0; i < game.correctVoters.length; i++) {
                payable(game.correctVoters[i]).transfer(prizePerWinner);
            }
        }
        
        // Send protocol fee to owner
        payable(owner).transfer(protocolFee);
        
        game.status = GameStatus.Completed;
        
        emit GameCompleted(_gameId, game.correctVoters, 
            game.correctVoters.length > 0 ? remainingPrize / game.correctVoters.length : 0);
    }
    
    /**
     * @dev Update the protocol fee percentage (only owner)
     * @param _newFeePercent New fee percentage in basis points (e.g., 1500 = 15%)
     */
    function updateProtocolFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 3000, "Fee too high"); // Max 30%
        protocolFeePercent = _newFeePercent;
        
        emit ProtocolFeeUpdated(_newFeePercent);
    }
    
    /**
     * @dev Get game details
     * @param _gameId The ID of the game
     * @return entryFee The entry fee for the game
     * @return prizePool The total prize pool
     * @return playerCount The number of players
     * @return status The status of the game
     */
    function getGameDetails(uint256 _gameId) external view gameExists(_gameId) returns (
        uint256 entryFee,
        uint256 prizePool,
        uint256 playerCount,
        GameStatus status
    ) {
        Game storage game = games[_gameId];
        
        return (
            game.entryFee,
            game.prizePool,
            game.players.length,
            game.status
        );
    }
    
    /**
     * @dev Check if a player has voted
     * @param _gameId The ID of the game
     * @param _player The address of the player
     * @return hasVoted Whether the player has voted
     */
    function hasPlayerVoted(uint256 _gameId, address _player) external view gameExists(_gameId) returns (bool) {
        return games[_gameId].hasVoted[_player];
    }
    
    /**
     * @dev Get the list of players in a game
     * @param _gameId The ID of the game
     * @return The array of player addresses
     */
    function getPlayers(uint256 _gameId) external view gameExists(_gameId) returns (address[] memory) {
        return games[_gameId].players;
    }
    
    /**
     * @dev Get the list of correct voters in a completed game
     * @param _gameId The ID of the game
     * @return The array of correct voter addresses
     */
    function getCorrectVoters(uint256 _gameId) external view gameExists(_gameId) returns (address[] memory) {
        require(games[_gameId].status == GameStatus.Completed, "Game not completed");
        return games[_gameId].correctVoters;
    }
}

