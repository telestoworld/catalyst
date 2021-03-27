import { DAOContractClient } from 'telestoworld-katalyst-commons/DAOClient'
import { DAOContract } from 'telestoworld-katalyst-contracts/DAOContract'
import { DAOListContract, DAOListContractsKeys } from 'telestoworld-katalyst-contracts/DAOListContract'
import { Environment, EnvironmentConfig } from '../../Environment'
import { DAOCache } from './DAOCache'
import { DAOListContractClient } from './DAOListsClient'

export class DAOCacheFactory {
  static create(env: Environment): DAOCache {
    const networkName: string = env.getConfig(EnvironmentConfig.ETH_NETWORK)
    const daoClient = new DAOContractClient(DAOContract.withNetwork(networkName))
    const poisClient = new DAOListContractClient(DAOListContract.withNetwork(networkName, DAOListContractsKeys.POIs))
    const denylistedNamesClient = new DAOListContractClient(
      DAOListContract.withNetwork(networkName, DAOListContractsKeys.denylistedNames)
    )
    return new DAOCache(daoClient, poisClient, denylistedNamesClient)
  }
}
