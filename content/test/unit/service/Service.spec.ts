import { ContentFile } from '@katalyst/content/controller/Controller'
import { Bean, Environment } from '@katalyst/content/Environment'
import { ContentAuthenticator } from '@katalyst/content/service/auth/Authenticator'
import { Entity } from '@katalyst/content/service/Entity'
import {
  DeploymentResult,
  isInvalidDeployment,
  LocalDeploymentAuditInfo,
  MetaverseContentService
} from '@katalyst/content/service/Service'
import { ServiceFactory } from '@katalyst/content/service/ServiceFactory'
import { ContentStorage, StorageContent } from '@katalyst/content/storage/ContentStorage'
import { assertPromiseRejectionIs } from '@katalyst/test-helpers/PromiseAssertions'
import { MockedAccessChecker } from '@katalyst/test-helpers/service/access/MockedAccessChecker'
import { buildEntityAndFile } from '@katalyst/test-helpers/service/EntityTestFactory'
import { MockedContentCluster } from '@katalyst/test-helpers/service/synchronization/MockedContentCluster'
import { NoOpValidations } from '@katalyst/test-helpers/service/validations/NoOpValidations'
import { MockedRepository } from '@katalyst/test-helpers/storage/MockedRepository'
import assert from 'assert'
import { ContentFileHash, EntityType, EntityVersion, ENTITY_FILE_NAME, Hashing } from 'tcl-catalyst-commons'
import { Authenticator } from 'tcl-crypto'
import { MockedStorage } from '../storage/MockedStorage'
import { NoOpDeploymentManager } from './deployments/NoOpDeploymentManager'
import { NoOpFailedDeploymentsManager } from './errors/NoOpFailedDeploymentsManager'
import { NoOpPointerManager } from './pointers/NoOpPointerManager'

describe('Service', function () {
  const auditInfo: LocalDeploymentAuditInfo = {
    authChain: Authenticator.createSimpleAuthChain('entityId', 'ethAddress', 'signature'),
    version: EntityVersion.V3
  }

  const initialAmountOfDeployments: number = 15

  let randomFile: { name: string; content: Buffer }
  let randomFileHash: ContentFileHash
  let entity: Entity
  let entityFile: ContentFile
  let storage: ContentStorage
  let service: MetaverseContentService

  beforeAll(async () => {
    randomFile = { name: 'file', content: Buffer.from('1234') }
    randomFileHash = await Hashing.calculateHash(randomFile)
      ;[entity, entityFile] = await buildEntityAndFile(
        EntityType.SCENE,
        ['X1,Y1', 'X2,Y2'],
        Date.now(),
        new Map([[randomFile.name, randomFileHash]]),
        'metadata'
      )
  })

  beforeEach(async () => {
    storage = new MockedStorage()
    service = await buildService()
  })

  it(`When no file called '${ENTITY_FILE_NAME}' is uploaded, then an exception is thrown`, async () => {
    await assertPromiseRejectionIs(
      () => service.deployEntity([randomFile], randomFileHash, auditInfo, ''),
      `Failed to find the entity file. Please make sure that it is named '${ENTITY_FILE_NAME}'.`
    )
  })

  it(`When two or more files called '${ENTITY_FILE_NAME}' are uploaded, then an exception is thrown`, async () => {
    const invalidEntityFile: ContentFile = { name: ENTITY_FILE_NAME, content: Buffer.from('Hello') }
    await assertPromiseRejectionIs(
      () => service.deployEntity([entityFile, invalidEntityFile], 'some-id', auditInfo, ''),
      `Found more than one file called '${ENTITY_FILE_NAME}'. Please make sure you upload only one with that name.`
    )
  })

  it(`When an entity is successfully deployed, then the content is stored correctly`, async () => {
    const storageSpy = spyOn(storage, 'store').and.callThrough()

    const deploymentResult: DeploymentResult = await service.deployEntity(
      [entityFile, randomFile],
      entity.id,
      auditInfo,
      ''
    )
    if (isInvalidDeployment(deploymentResult)) {
      assert.fail(
        'The deployment result: ' + deploymentResult + ' was expected to be successful, it was invalid instead.'
      )
    } else {
      const deltaMilliseconds = Date.now() - deploymentResult
      expect(deltaMilliseconds).toBeGreaterThanOrEqual(0)
      expect(deltaMilliseconds).toBeLessThanOrEqual(10)
      expect(storageSpy).toHaveBeenCalledWith(entity.id, equalDataOnStorageContent(entityFile.content))
      expect(storageSpy).toHaveBeenCalledWith(randomFileHash, equalDataOnStorageContent(randomFile.content))
    }
  })

  it(`When a file is already uploaded, then don't try to upload it again`, async () => {
    // Consider the random file as already uploaded, but not the entity file
    spyOn(storage, 'exist').and.callFake((ids: string[]) =>
      Promise.resolve(new Map(ids.map((id) => [id, id === randomFileHash])))
    )
    const storeSpy = spyOn(storage, 'store')

    await service.deployEntity([entityFile, randomFile], entity.id, auditInfo, '')

    expect(storeSpy).toHaveBeenCalledWith(entity.id, equalDataOnStorageContent(entityFile.content))
    expect(storeSpy).not.toHaveBeenCalledWith(randomFileHash, equalDataOnStorageContent(randomFile.content))
  })

  it(`When the service is started, then the amount of deployments is obtained from the repository`, async () => {
    await service.start()

    const status = service.getStatus()

    expect(status.historySize).toBe(initialAmountOfDeployments)
  })

  it(`When a new deployment is made, then the amount of deployments is increased`, async () => {
    await service.start()
    await service.deployEntity([entityFile, randomFile], entity.id, auditInfo, '')

    const status = service.getStatus()

    expect(status.historySize).toBe(initialAmountOfDeployments + 1)
  })

  it(`When a new deployment is made and fails, then the amount of deployments is not modified`, async () => {
    await service.start()
    try {
      await service.deployEntity([randomFile], randomFileHash, auditInfo, '')
    } catch { }

    const status = service.getStatus()

    expect(status.historySize).toBe(initialAmountOfDeployments)
  })

  async function buildService() {
    const env = new Environment()
      .registerBean(Bean.STORAGE, storage)
      .registerBean(Bean.ACCESS_CHECKER, new MockedAccessChecker())
      .registerBean(Bean.AUTHENTICATOR, new ContentAuthenticator())
      .registerBean(Bean.VALIDATIONS, new NoOpValidations())
      .registerBean(Bean.CONTENT_CLUSTER, MockedContentCluster.withoutIdentity())
      .registerBean(Bean.FAILED_DEPLOYMENTS_MANAGER, NoOpFailedDeploymentsManager.build())
      .registerBean(Bean.POINTER_MANAGER, NoOpPointerManager.build())
      .registerBean(Bean.DEPLOYMENT_MANAGER, NoOpDeploymentManager.build())
      .registerBean(Bean.REPOSITORY, MockedRepository.build(initialAmountOfDeployments))
    return ServiceFactory.create(env)
  }

  function equalDataOnStorageContent(data: Buffer): jasmine.AsymmetricMatcher<StorageContent> {
    return {
      asymmetricMatch: function (compareTo) {
        return compareTo.data === data
      },
      jasmineToString: function () {
        return `<StorageContent with Data: ${data}>`
      }
    }
  }
})
