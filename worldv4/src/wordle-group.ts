import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  GroupCreated,
  MemberAdded
} from "../generated/Wordle/Wordle"
import { Group, GroupMember } from "../generated/schema"

export function handleGroupCreated(event: GroupCreated): void {
  const groupId = event.params.groupId.toString()
  const group = new Group(groupId)
  
  group.name = event.params.name
  group.account = event.params.account
  group.creator = event.transaction.from
  group.createdAt = event.block.timestamp
  
  group.save()
}

export function handleMemberAdded(event: MemberAdded): void {
  const groupId = event.params.groupId.toString()
  const memberId = groupId.concat('-').concat(event.params.member.toHexString())
  
  const member = new GroupMember(memberId)
  member.group = groupId
  member.member = event.params.member
  member.joinedAt = event.block.timestamp
  
  member.save()
} 