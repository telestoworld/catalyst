import { ContentFile } from '@katalyst/content/controller/Controller'
import { Bean, EnvironmentConfig } from '@katalyst/content/Environment'
import { assertPromiseRejectionIs } from '@katalyst/test-helpers/PromiseAssertions'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { addModelToFormData } from 'tcl-catalyst-client'
import { Authenticator } from 'tcl-crypto'
import { MockedSynchronizationManager } from '../helpers/service/synchronization/MockedSynchronizationManager'
import { assertResponseIsOkOrThrow } from './E2EAssertions'
import { loadStandaloneTestEnvironment } from './E2ETestEnvironment'
import { buildDeployData, createIdentity, DeployData } from './E2ETestUtils'
import { TestServer } from './TestServer'

describe('End 2 end - Legacy Entities', () => {
  const identity = createIdentity()
  const testEnv = loadStandaloneTestEnvironment()
  let server: TestServer

  beforeEach(async () => {
    server = await testEnv
      .configServer()
      .withBean(Bean.SYNCHRONIZATION_MANAGER, new MockedSynchronizationManager())
      .withConfig(EnvironmentConfig.telestoworld_ADDRESS, identity.address)
      .withConfig(EnvironmentConfig.ALLOW_LEGACY_ENTITIES, true)
      .andBuild()
    await server.start()
  })

  it(`When a non-telestoworld address tries to deploy a legacy entity, then an exception is thrown`, async () => {
    // Prepare entity to deploy
    const { deployData } = await buildDeployData(['0,0', '0,1'], { metadata: 'metadata', identity: createIdentity() })

    // Try to deploy the entity
    await assertPromiseRejectionIs(
      () => deployLegacy(server, deployData),
      `Expected an address owned by telestoworld. Instead, we found ${Authenticator.ownerAddress(deployData.authChain)}`
    )
  })

  it(`When a telestoworld address tries to deploy a legacy entity, then it is successful`, async () => {
    // Prepare entity to deploy
    const { deployData } = await buildDeployData(['0,0', '0,1'], { metadata: 'metadata', identity })

    // Deploy the entity
    await deployLegacy(server, deployData)
  })

  it(`When a user tries to deploy a legacy entity over an entity with a higher version, then an error is thrown`, async () => {
    // Prepare entity to deploy
    const { deployData: deployData1 } = await buildDeployData(['0,0', '0,1'], { metadata: 'metadata', identity })

    // Deploy entity with current version
    await server.deploy(deployData1)

    // Prepare new entity to deploy
    const { deployData: deployData2 } = await buildDeployData(['0,1'], { metadata: 'metadata', identity })

    // Deploy the entity
    await assertPromiseRejectionIs(
      () => deployLegacy(server, deployData2),
      'Found an overlapping entity with a higher version already deployed.'
    )
  })
})

async function deployLegacy(server: TestServer, deployData: DeployData) {
  const form = new FormData()
  form.append('entityId', deployData.entityId)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  addModelToFormData(deployData.authChain, form, 'authChain')
  form.append('version', 'v2')
  form.append('migration_data', JSON.stringify({ data: 'data' }))

  deployData.files.forEach((f: ContentFile) => form.append(f.name, f.content, { filename: f.name }))

  const deployResponse = await fetch(`${server.getAddress()}/legacy-entities`, { method: 'POST', body: form })
  await assertResponseIsOkOrThrow(deployResponse)
}
