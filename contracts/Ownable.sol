pragma solidity ^0.4.21;


contract Ownable {

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyCustomer(address _customer) {
        require(msg.sender == _customer || msg.sender == owner);
        _;
    }

}
