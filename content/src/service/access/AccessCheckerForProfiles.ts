import { Pointer } from 'tcl-catalyst-commons'
import { EthAddress } from 'tcl-crypto'
import { ContentAuthenticator } from '../auth/Authenticator'

export class AccessCheckerForProfiles {
  constructor(private readonly authenticator: ContentAuthenticator) { }

  public async checkAccess(pointers: Pointer[], ethAddress: EthAddress): Promise<string[]> {
    const errors: string[] = []

    if (pointers.length != 1) {
      errors.push(`Only one pointer is allowed when you create a Profile. Received: ${pointers}`)
    }

    const pointer: Pointer = pointers[0].toLowerCase()

    if (pointer.startsWith('default')) {
      if (!this.authenticator.isAddressOwnedBytelestoworld(ethAddress)) {
        errors.push(`Only telestoworld can add or modify default profiles`)
      }
    } else if (pointer !== ethAddress.toLowerCase()) {
      errors.push(`You can only alter your own profile. The pointer address and the signer address are different.`)
    }

    return errors
  }
}
