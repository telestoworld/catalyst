import log4js from 'log4js'
import ms from 'ms'
import { EntityType, EntityVersion } from 'tcl-catalyst-commons'
import { telestoworld_ADDRESS } from 'telestoworld-katalyst-commons/addresses'
import { ControllerFactory } from './controller/ControllerFactory'
import { DenylistFactory } from './denylist/DenylistFactory'
import { FetcherFactory } from './helpers/FetcherFactory'
import { MigrationManagerFactory } from './migrations/MigrationManagerFactory'
import { AccessCheckerImplFactory } from './service/access/AccessCheckerImplFactory'
import { AuthenticatorFactory } from './service/auth/AuthenticatorFactory'
import { DeploymentManagerFactory } from './service/deployments/DeploymentManagerFactory'
import { FailedDeploymentsManager } from './service/errors/FailedDeploymentsManager'
import { GarbageCollectionManagerFactory } from './service/garbage-collection/GarbageCollectionManagerFactory'
import { PointerManagerFactory } from './service/pointers/PointerManagerFactory'
import { SegmentIoAnalyticsFactory } from './service/reporters/SegmentIoAnalyticsFactory'
import { SQSDeploymentReporterFactory } from './service/reporters/SQSDeploymentReporterFactory'
import { ServiceFactory } from './service/ServiceFactory'
import { SnapshotManagerFactory } from './service/snapshots/SnapshotManagerFactory'
import { ChallengeSupervisor } from './service/synchronization/ChallengeSupervisor'
import { DAOClientFactory } from './service/synchronization/clients/DAOClientFactory'
import { ClusterSynchronizationManagerFactory } from './service/synchronization/ClusterSynchronizationManagerFactory'
import { ContentClusterFactory } from './service/synchronization/ContentClusterFactory'
import { EventDeployerFactory } from './service/synchronization/EventDeployerFactory'
import { SystemPropertiesManagerFactory } from './service/system-properties/SystemPropertiesManagerFactory'
import { ValidationsFactory } from './service/validations/ValidationsFactory'
import { ContentStorageFactory } from './storage/ContentStorageFactory'
import { RepositoryFactory } from './storage/RepositoryFactory'

export const CURRENT_CONTENT_VERSION: EntityVersion = EntityVersion.V3
const DEFAULT_STORAGE_ROOT_FOLDER = 'storage'
const DEFAULT_SERVER_PORT = 6969
export const DEFAULT_ETH_NETWORK = 'ropsten'
export const DEFAULT_tcl_PARCEL_ACCESS_URL_ROPSTEN =
  'https://api.thegraph.com/subgraphs/name/telestoworld/space-manager-ropsten'
export const DEFAULT_tcl_PARCEL_ACCESS_URL_MAINNET = 'https://api.thegraph.com/subgraphs/name/telestoworld/space-manager'
export const DEFAULT_tcl_COLLECTIONS_ACCESS_URL_ROPSTEN =
  'https://api.thegraph.com/subgraphs/name/telestoworld/collections-ethereum-ropsten'
export const DEFAULT_tcl_COLLECTIONS_ACCESS_URL_MAINNET =
  'https://api.thegraph.com/subgraphs/name/telestoworld/collections-ethereum-mainnet'
export const CURRENT_COMMIT_HASH = process.env.COMMIT_HASH ?? 'Unknown'
export const CURRENT_CATALYST_VERSION = process.env.CATALYST_VERSION ?? 'Unknown'
export const DEFAULT_DATABASE_CONFIG = {
  password: '12345678',
  user: 'postgres',
  database: 'content',
  host: 'localhost',
  schema: 'public',
  port: 5432
}

export class Environment {
  private static readonly LOGGER = log4js.getLogger('Environment')
  private configs: Map<EnvironmentConfig, any>
  private beans: Map<Bean, any>

  constructor(otherEnv?: Environment) {
    this.configs = otherEnv ? new Map(otherEnv.configs) : new Map()
    this.beans = otherEnv ? new Map(otherEnv.beans) : new Map()
  }

  getConfig<T>(key: EnvironmentConfig): T {
    return this.configs.get(key)
  }

  setConfig<T>(key: EnvironmentConfig, value: T): Environment {
    this.configs.set(key, value)
    return this
  }

  getBean<T>(type: Bean): T {
    return this.beans.get(type)
  }

  registerBean<T>(type: Bean, bean: T): Environment {
    this.beans.set(type, bean)
    return this
  }

  logConfigValues() {
    Environment.LOGGER.info('These are the configuration values:')
    for (const [config, value] of this.configs.entries()) {
      Environment.LOGGER.info(`${EnvironmentConfig[config]}: ${JSON.stringify(value)}`)
    }
  }

  private static instance: Environment
  static async getInstance(): Promise<Environment> {
    if (!Environment.instance) {
      // Create default instance
      Environment.instance = await new EnvironmentBuilder().build()
    }
    return Environment.instance
  }
}

export const enum Bean {
  STORAGE,
  SERVICE,
  CONTROLLER,
  POINTER_MANAGER,
  SEGMENT_IO_ANALYTICS,
  SQS_DEPLOYMENT_REPORTER,
  SYNCHRONIZATION_MANAGER,
  DAO_CLIENT,
  ACCESS_CHECKER,
  DEPLOYMENT_MANAGER,
  CONTENT_CLUSTER,
  EVENT_DEPLOYER,
  DENYLIST,
  AUTHENTICATOR,
  FAILED_DEPLOYMENTS_MANAGER,
  FETCHER,
  VALIDATIONS,
  CHALLENGE_SUPERVISOR,
  REPOSITORY,
  MIGRATION_MANAGER,
  GARBAGE_COLLECTION_MANAGER,
  SYSTEM_PROPERTIES_MANAGER,
  SNAPSHOT_MANAGER
}

export enum EnvironmentConfig {
  STORAGE_ROOT_FOLDER,
  SERVER_PORT,
  METRICS,
  LOG_REQUESTS,
  SEGMENT_WRITE_KEY,
  UPDATE_FROM_DAO_INTERVAL,
  SYNC_WITH_SERVERS_INTERVAL,
  ALLOW_LEGACY_ENTITIES,
  telestoworld_ADDRESS,
  ETH_NETWORK,
  LOG_LEVEL,
  FETCH_REQUEST_TIMEOUT,
  USE_COMPRESSION_MIDDLEWARE,
  BOOTSTRAP_FROM_SCRATCH,
  REQUEST_TTL_BACKWARDS,
  tcl_PARCEL_ACCESS_URL,
  tcl_COLLECTIONS_ACCESS_URL,
  SQS_QUEUE_URL_REPORTING,
  SQS_ACCESS_KEY_ID,
  SQS_SECRET_ACCESS_KEY,
  PSQL_PASSWORD,
  PSQL_USER,
  PSQL_DATABASE,
  PSQL_HOST,
  PSQL_SCHEMA,
  PSQL_PORT,
  GARBAGE_COLLECTION,
  GARBAGE_COLLECTION_INTERVAL,
  SNAPSHOT_FREQUENCY,
  CUSTOM_DAO,
  DISABLE_SYNCHRONIZATION,
  DISABLE_DENYLIST,
  CONTENT_SERVER_ADDRESS
}

export class EnvironmentBuilder {
  private baseEnv: Environment
  constructor(other?: Environment | EnvironmentBuilder) {
    if (other) {
      if (other instanceof EnvironmentBuilder) {
        this.baseEnv = new Environment(other.baseEnv)
      } else {
        this.baseEnv = new Environment(other)
      }
    } else {
      this.baseEnv = new Environment()
    }
  }

  withBean(bean: Bean, value: any): EnvironmentBuilder {
    this.baseEnv.registerBean(bean, value)
    return this
  }

  withConfig(config: EnvironmentConfig, value: any): EnvironmentBuilder {
    this.baseEnv.setConfig(config, value)
    return this
  }

  async build(): Promise<Environment> {
    const env = new Environment()

    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.STORAGE_ROOT_FOLDER,
      () => process.env.STORAGE_ROOT_FOLDER ?? DEFAULT_STORAGE_ROOT_FOLDER
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.SERVER_PORT,
      () => process.env.CONTENT_SERVER_PORT ?? DEFAULT_SERVER_PORT
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.SEGMENT_WRITE_KEY, () => process.env.SEGMENT_WRITE_KEY)
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.METRICS, () => process.env.METRICS === 'true')
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.LOG_REQUESTS, () => process.env.LOG_REQUESTS !== 'false')
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.UPDATE_FROM_DAO_INTERVAL,
      () => process.env.UPDATE_FROM_DAO_INTERVAL ?? ms('30m')
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.SYNC_WITH_SERVERS_INTERVAL,
      () => process.env.SYNC_WITH_SERVERS_INTERVAL ?? ms('45s')
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.telestoworld_ADDRESS, () => telestoworld_ADDRESS)
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.ALLOW_LEGACY_ENTITIES,
      () => process.env.ALLOW_LEGACY_ENTITIES === 'true'
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.ETH_NETWORK,
      () => process.env.ETH_NETWORK ?? DEFAULT_ETH_NETWORK
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.LOG_LEVEL, () => process.env.LOG_LEVEL ?? 'info')
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.FETCH_REQUEST_TIMEOUT,
      () => process.env.FETCH_REQUEST_TIMEOUT ?? '2m'
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.USE_COMPRESSION_MIDDLEWARE,
      () => process.env.USE_COMPRESSION_MIDDLEWARE === 'true'
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.BOOTSTRAP_FROM_SCRATCH,
      () => process.env.BOOTSTRAP_FROM_SCRATCH === 'true'
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.REQUEST_TTL_BACKWARDS, () => ms('20m'))
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.tcl_PARCEL_ACCESS_URL,
      () =>
        process.env.tcl_PARCEL_ACCESS_URL ??
        (env.getConfig(EnvironmentConfig.ETH_NETWORK) === 'mainnet'
          ? DEFAULT_tcl_PARCEL_ACCESS_URL_MAINNET
          : DEFAULT_tcl_PARCEL_ACCESS_URL_ROPSTEN)
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.tcl_COLLECTIONS_ACCESS_URL,
      () =>
        process.env.tcl_COLLECTIONS_ACCESS_URL ??
        (env.getConfig(EnvironmentConfig.ETH_NETWORK) === 'mainnet'
          ? DEFAULT_tcl_COLLECTIONS_ACCESS_URL_MAINNET
          : DEFAULT_tcl_COLLECTIONS_ACCESS_URL_ROPSTEN)
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.SQS_QUEUE_URL_REPORTING,
      () => process.env.SQS_QUEUE_URL_REPORTING
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.SQS_ACCESS_KEY_ID, () => process.env.SQS_ACCESS_KEY_ID)
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.SQS_SECRET_ACCESS_KEY,
      () => process.env.SQS_SECRET_ACCESS_KEY
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_PASSWORD,
      () => process.env.POSTGRES_CONTENT_PASSWORD ?? DEFAULT_DATABASE_CONFIG.password
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_USER,
      () => process.env.POSTGRES_CONTENT_USER ?? DEFAULT_DATABASE_CONFIG.user
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_DATABASE,
      () => process.env.POSTGRES_CONTENT_DB ?? DEFAULT_DATABASE_CONFIG.database
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_HOST,
      () => process.env.POSTGRES_HOST ?? DEFAULT_DATABASE_CONFIG.host
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_SCHEMA,
      () => process.env.POSTGRES_SCHEMA ?? DEFAULT_DATABASE_CONFIG.schema
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.PSQL_PORT,
      () => process.env.POSTGRES_PORT ?? DEFAULT_DATABASE_CONFIG.port
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.GARBAGE_COLLECTION,
      () => process.env.GARBAGE_COLLECTION === 'true'
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.GARBAGE_COLLECTION_INTERVAL, () => ms('6h'))
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.SNAPSHOT_FREQUENCY,
      () =>
        new Map([
          [EntityType.SCENE, 100],
          [EntityType.PROFILE, 500],
          [EntityType.WEARABLE, 50]
        ])
    )
    this.registerConfigIfNotAlreadySet(env, EnvironmentConfig.CUSTOM_DAO, () => process.env.CUSTOM_DAO)

    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.DISABLE_SYNCHRONIZATION,
      () => process.env.DISABLE_SYNCHRONIZATION === 'true'
    )
    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.DISABLE_DENYLIST,
      () => process.env.DISABLE_DENYLIST !== 'false'
    )

    this.registerConfigIfNotAlreadySet(
      env,
      EnvironmentConfig.CONTENT_SERVER_ADDRESS,
      () => process.env.CONTENT_SERVER_ADDRESS
    )

    // Please put special attention on the bean registration order.
    // Some beans depend on other beans, so the required beans should be registered before

    const repository = await RepositoryFactory.create(env)
    this.registerBeanIfNotAlreadySet(env, Bean.REPOSITORY, () => repository)
    this.registerBeanIfNotAlreadySet(env, Bean.SYSTEM_PROPERTIES_MANAGER, () =>
      SystemPropertiesManagerFactory.create(env)
    )
    this.registerBeanIfNotAlreadySet(env, Bean.CHALLENGE_SUPERVISOR, () => new ChallengeSupervisor())
    this.registerBeanIfNotAlreadySet(env, Bean.FETCHER, () => FetcherFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.DAO_CLIENT, () => DAOClientFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.AUTHENTICATOR, () => AuthenticatorFactory.create(env))
    const localStorage = await ContentStorageFactory.local(env)
    this.registerBeanIfNotAlreadySet(env, Bean.STORAGE, () => localStorage)
    this.registerBeanIfNotAlreadySet(env, Bean.CONTENT_CLUSTER, () => ContentClusterFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.DEPLOYMENT_MANAGER, () => DeploymentManagerFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.DENYLIST, () => DenylistFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.POINTER_MANAGER, () => PointerManagerFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.ACCESS_CHECKER, () => AccessCheckerImplFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.FAILED_DEPLOYMENTS_MANAGER, () => new FailedDeploymentsManager())
    this.registerBeanIfNotAlreadySet(env, Bean.VALIDATIONS, () => ValidationsFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.SERVICE, () => ServiceFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.SEGMENT_IO_ANALYTICS, () => SegmentIoAnalyticsFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.SQS_DEPLOYMENT_REPORTER, () => SQSDeploymentReporterFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.SNAPSHOT_MANAGER, () => SnapshotManagerFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.GARBAGE_COLLECTION_MANAGER, () =>
      GarbageCollectionManagerFactory.create(env)
    )
    this.registerBeanIfNotAlreadySet(env, Bean.EVENT_DEPLOYER, () => EventDeployerFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.SYNCHRONIZATION_MANAGER, () =>
      ClusterSynchronizationManagerFactory.create(env)
    )
    this.registerBeanIfNotAlreadySet(env, Bean.CONTROLLER, () => ControllerFactory.create(env))
    this.registerBeanIfNotAlreadySet(env, Bean.MIGRATION_MANAGER, () => MigrationManagerFactory.create(env))

    return env
  }

  private registerConfigIfNotAlreadySet(env: Environment, key: EnvironmentConfig, valueProvider: () => any): void {
    env.setConfig(key, this.baseEnv.getConfig(key) ?? valueProvider())
  }

  private registerBeanIfNotAlreadySet(env: Environment, key: Bean, valueProvider: () => any): void {
    env.registerBean(key, this.baseEnv.getBean(key) ?? valueProvider())
  }
}
