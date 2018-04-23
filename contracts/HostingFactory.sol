pragma solidity ^0.4.21;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./HostingContract.sol";


contract HostingFactory is Ownable {

    using SafeMath for uint;

    address[] public contracts;
    uint public price;
    bool private reentrancyLock = false;

    event NewContract(address _customer, address _contract);

    function setPrice(uint _price) public onlyOwner {
        price = _price;
    }

    function createHostingContract(uint _endTime, uint _capacity, string _hash) payable public returns (address) {
        require(msg.value >= price.mul(_capacity));
        require(msg.sender != address(0));
        require(!reentrancyLock);

        reentrancyLock = true;
        address _contract = new HostingContract(msg.sender, _endTime, _hash);
        contracts.push(_contract);
        emit NewContract(msg.sender, _contract);
        reentrancyLock = false;
        return _contract;
    }

    function withdrawFees() public onlyOwner {
        owner.transfer(address(this).balance);
    }

}
