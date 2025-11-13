// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title DonorVerification
 * @dev Stores donor certificate verification records on blockchain
 * @notice This contract provides tamper-proof storage of donor eligibility verification
 * 
 * Features:
 * - Stores certificate hash and eligibility status
 * - Admin-controlled verification (can be restricted to specific addresses)
 * - Event emissions for audit trail
 * - Query interface for verification
 */
contract DonorVerification {
    
    // Struct to store verification record
    struct Record {
        address donor;
        bytes32 certHash;
        bool eligible;
        uint256 timestamp;
        bool exists;
    }
    
    // Mapping from donor address to their latest verification record
    mapping(address => Record) public records;
    
    // Admin address that can add verifications
    address public admin;
    
    // Events
    event RecordAdded(
        address indexed donor, 
        bytes32 certHash, 
        bool eligible, 
        uint256 timestamp,
        address indexed verifier
    );
    
    event RecordUpdated(
        address indexed donor, 
        bytes32 oldHash,
        bytes32 newHash, 
        bool eligible, 
        uint256 timestamp
    );
    
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    /**
     * @dev Constructor sets the deployer as initial admin
     */
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Store or update a donor verification record
     * @param _donor Address of the donor (can be zero address for privacy)
     * @param _certHash SHA-256 hash of the certificate file
     * @param _eligible Whether the donor is eligible (true) or not (false)
     */
    function storeVerification(
        address _donor, 
        bytes32 _certHash, 
        bool _eligible
    ) public onlyAdmin {
        require(_certHash != bytes32(0), "Certificate hash cannot be empty");
        
        bool isUpdate = records[_donor].exists;
        bytes32 oldHash = records[_donor].certHash;
        
        records[_donor] = Record({
            donor: _donor,
            certHash: _certHash,
            eligible: _eligible,
            timestamp: block.timestamp,
            exists: true
        });
        
        if (isUpdate) {
            emit RecordUpdated(_donor, oldHash, _certHash, _eligible, block.timestamp);
        } else {
            emit RecordAdded(_donor, _certHash, _eligible, block.timestamp, msg.sender);
        }
    }
    
    /**
     * @dev Verify a certificate hash for a donor
     * @param _donor Address of the donor
     * @param _certHash Certificate hash to verify
     * @return eligible Whether the donor is eligible
     * @return timestamp When the record was created
     * @return matches Whether the provided hash matches the stored hash
     */
    function verify(
        address _donor, 
        bytes32 _certHash
    ) public view returns (
        bool eligible, 
        uint256 timestamp,
        bool matches
    ) {
        Record memory r = records[_donor];
        
        if (!r.exists) {
            return (false, 0, false);
        }
        
        matches = (r.certHash == _certHash);
        return (r.eligible, r.timestamp, matches);
    }
    
    /**
     * @dev Get the full record for a donor
     * @param _donor Address of the donor
     * @return certHash The stored certificate hash
     * @return eligible Eligibility status
     * @return timestamp When recorded
     * @return exists Whether a record exists
     */
    function getRecord(address _donor) public view returns (
        bytes32 certHash,
        bool eligible,
        uint256 timestamp,
        bool exists
    ) {
        Record memory r = records[_donor];
        return (r.certHash, r.eligible, r.timestamp, r.exists);
    }
    
    /**
     * @dev Change the admin address
     * @param _newAdmin New admin address
     */
    function changeAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "New admin cannot be zero address");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminChanged(oldAdmin, _newAdmin);
    }
    
    /**
     * @dev Check if a donor has a verification record
     * @param _donor Address of the donor
     * @return True if record exists
     */
    function hasRecord(address _donor) public view returns (bool) {
        return records[_donor].exists;
    }
}
