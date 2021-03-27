import { EntityType, Pointer, Timestamp } from 'tcl-catalyst-commons'
import { EthAddress } from 'tcl-crypto'

export interface AccessChecker {
  hasAccess(
    entityType: EntityType,
    pointers: Pointer[],
    timestamp: Timestamp,
    ethAddress: EthAddress
  ): Promise<string[]>
}
