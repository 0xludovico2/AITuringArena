// ABI for the TuringArena contract
export const TURING_ARENA_ABI = [
  // View functions
  "function gameIdCounter() view returns (uint256)",
  "function protocolFeePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function GAME_TIMEOUT() view returns (uint256)",

  // Game management functions
  "function createGame(uint256 _entryFee) external payable",
  "function joinGame(uint256 _gameId) external payable",
  "function setAIPlayer(uint256 _gameId, address _aiPlayer) external",
  "function startGame(uint256 _gameId, uint256 _duration) external",
  "function castVote(uint256 _gameId, address _votedFor) external",
  "function endGame(uint256 _gameId) external",
  "function finishTimedOutGame(uint256 _gameId) external",
  "function hasGameTimedOut(uint256 _gameId) view returns (bool)",

  // View functions for game details
  "function getGameDetails(uint256 _gameId) external view returns (uint256 entryFee, uint256 prizePool, uint256 playerCount, uint8 status, uint256 creationTime, uint256 lastJoinTime, uint256 timeUntilTimeout)",
  "function getPlayers(uint256 _gameId) external view returns (address[])",
  "function getActiveGames() external view returns (uint256[])",

  // Events
  "event GameCreated(uint256 indexed gameId, uint256 entryFee, address creator)",
  "event PlayerJoined(uint256 indexed gameId, address indexed player)",
  "event AIPlayerSet(uint256 indexed gameId, address indexed aiPlayer)",
  "event GameStarted(uint256 indexed gameId, uint256 startTime)",
  "event VoteCast(uint256 indexed gameId, address indexed voter, address indexed votedFor)",
  "event GameCompleted(uint256 indexed gameId, address[] winners, uint256 prizePerWinner)",
  "event GameTimedOut(uint256 indexed gameId, uint256 time)",
]

