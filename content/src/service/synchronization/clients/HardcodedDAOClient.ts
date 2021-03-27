import { ServerAddress } from 'tcl-catalyst-commons'
import { DAOClient } from 'telestoworld-katalyst-commons/DAOClient'
import { ServerMetadata } from 'telestoworld-katalyst-commons/ServerMetadata'

export class DAOHardcodetclient implements DAOClient {
  constructor(private readonly servers: ServerAddress[]) { }

  async getAllContentServers(): Promise<Set<ServerMetadata>> {
    const servers: Set<ServerMetadata> = await this.getAllServers()
    return new Set(Array.from(servers.values()).map((server) => ({ ...server, address: server.address + '/content' })))
  }

  getAllServers(): Promise<Set<ServerMetadata>> {
    return Promise.resolve(
      new Set(
        this.servers.map((server, index) => ({
          address: server,
          owner: '0x0000000000000000000000000000000000000000',
          id: `${index}`
        }))
      )
    )
  }
}
