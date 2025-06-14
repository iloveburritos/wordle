import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ApprovalForAll,
  ForwarderUpdated,
  NewGroup,
  NewUser,
  OwnershipTransferred,
  RemoveUser,
  ScoreAdded,
  ScoresCleared,
  TransferBatch,
  TransferSingle,
  URI
} from "../generated/wordl3/wordl3"

export function createApprovalForAllEvent(
  account: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createForwarderUpdatedEvent(
  newForwarder: Address
): ForwarderUpdated {
  let forwarderUpdatedEvent = changetype<ForwarderUpdated>(newMockEvent())

  forwarderUpdatedEvent.parameters = new Array()

  forwarderUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newForwarder",
      ethereum.Value.fromAddress(newForwarder)
    )
  )

  return forwarderUpdatedEvent
}

export function createNewGroupEvent(tokenId: BigInt, owner: Address): NewGroup {
  let newGroupEvent = changetype<NewGroup>(newMockEvent())

  newGroupEvent.parameters = new Array()

  newGroupEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  newGroupEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return newGroupEvent
}

export function createNewUserEvent(tokenId: BigInt, user: Address): NewUser {
  let newUserEvent = changetype<NewUser>(newMockEvent())

  newUserEvent.parameters = new Array()

  newUserEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  newUserEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )

  return newUserEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createRemoveUserEvent(
  tokenId: BigInt,
  user: Address
): RemoveUser {
  let removeUserEvent = changetype<RemoveUser>(newMockEvent())

  removeUserEvent.parameters = new Array()

  removeUserEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  removeUserEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )

  return removeUserEvent
}

export function createScoreAddedEvent(
  gameId: BigInt,
  user: Address,
  ciphertext: string,
  datatoencrypthash: string
): ScoreAdded {
  let scoreAddedEvent = changetype<ScoreAdded>(newMockEvent())

  scoreAddedEvent.parameters = new Array()

  scoreAddedEvent.parameters.push(
    new ethereum.EventParam("gameId", ethereum.Value.fromUnsignedBigInt(gameId))
  )
  scoreAddedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  scoreAddedEvent.parameters.push(
    new ethereum.EventParam("ciphertext", ethereum.Value.fromString(ciphertext))
  )
  scoreAddedEvent.parameters.push(
    new ethereum.EventParam(
      "datatoencrypthash",
      ethereum.Value.fromString(datatoencrypthash)
    )
  )

  return scoreAddedEvent
}

export function createScoresClearedEvent(
  previousGameId: BigInt,
  newGameId: BigInt
): ScoresCleared {
  let scoresClearedEvent = changetype<ScoresCleared>(newMockEvent())

  scoresClearedEvent.parameters = new Array()

  scoresClearedEvent.parameters.push(
    new ethereum.EventParam(
      "previousGameId",
      ethereum.Value.fromUnsignedBigInt(previousGameId)
    )
  )
  scoresClearedEvent.parameters.push(
    new ethereum.EventParam(
      "newGameId",
      ethereum.Value.fromUnsignedBigInt(newGameId)
    )
  )

  return scoresClearedEvent
}

export function createTransferBatchEvent(
  operator: Address,
  from: Address,
  to: Address,
  ids: Array<BigInt>,
  values: Array<BigInt>
): TransferBatch {
  let transferBatchEvent = changetype<TransferBatch>(newMockEvent())

  transferBatchEvent.parameters = new Array()

  transferBatchEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("ids", ethereum.Value.fromUnsignedBigIntArray(ids))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam(
      "values",
      ethereum.Value.fromUnsignedBigIntArray(values)
    )
  )

  return transferBatchEvent
}

export function createTransferSingleEvent(
  operator: Address,
  from: Address,
  to: Address,
  id: BigInt,
  value: BigInt
): TransferSingle {
  let transferSingleEvent = changetype<TransferSingle>(newMockEvent())

  transferSingleEvent.parameters = new Array()

  transferSingleEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferSingleEvent
}

export function createURIEvent(value: string, id: BigInt): URI {
  let uriEvent = changetype<URI>(newMockEvent())

  uriEvent.parameters = new Array()

  uriEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromString(value))
  )
  uriEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return uriEvent
}
