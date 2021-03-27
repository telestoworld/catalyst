import { DAOClient, DAOContractClient } from 'telestoworld-katalyst-commons/DAOClient'
import { DAOContract } from 'telestoworld-katalyst-contracts/DAOContract'
import { Environment, EnvironmentConfig } from '../../../Environment'
import { DAOHardcodetclient } from './HardcodedDAOClient'

export class DAOClientFactory {
  static create(env: Environment): DAOClient {
    const customDAO: string = env.getConfig(EnvironmentConfig.CUSTOM_DAO) ?? ''
    if (customDAO && customDAO.trim().length !== 0) {
      return new DAOHardcodetclient(customDAO.split(','))
    }
    const contract = DAOContract.withNetwork(env.getConfig(EnvironmentConfig.ETH_NETWORK))
    return new DAOContractClient(contract)
  }
}
