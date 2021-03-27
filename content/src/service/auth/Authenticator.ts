import { AuthChain, Authenticator, EthAddress, ValidationResult } from 'tcl-crypto'
import { telestoworld_ADDRESS } from 'telestoworld-katalyst-commons/addresses'
import { EthereumProvider } from 'web3x/providers'

export class ContentAuthenticator extends Authenticator {
  constructor(private readonly telestoworldAddress: EthAddress = telestoworld_ADDRESS) {
    super()
  }

  /** Return whether the given address used is owned by telestoworld */
  isAddressOwnedBytelestoworld(address: EthAddress): boolean {
    return address.toLowerCase() === this.telestoworldAddress.toLowerCase()
  }

  /** Validate that the signature belongs to the Ethereum address */
  async validateSignature(
    expectedFinalAuthority: string,
    authChain: AuthChain,
    provider: EthereumProvider,
    dateToValidateExpirationInMillis: number
  ): Promise<ValidationResult> {
    return Authenticator.validateSignature(
      expectedFinalAuthority,
      authChain,
      provider,
      dateToValidateExpirationInMillis
    )
  }
}
