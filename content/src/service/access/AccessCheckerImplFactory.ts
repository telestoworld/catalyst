import { Bean, Environment, EnvironmentConfig } from '@katalyst/content/Environment'
import { AccessCheckerImpl } from './AccessCheckerImpl'

export class AccessCheckerImplFactory {
  static create(env: Environment): AccessCheckerImpl {
    return new AccessCheckerImpl(
      env.getBean(Bean.AUTHENTICATOR),
      env.getBean(Bean.FETCHER),
      env.getConfig(EnvironmentConfig.tcl_PARCEL_ACCESS_URL),
      env.getConfig(EnvironmentConfig.tcl_COLLECTIONS_ACCESS_URL)
    )
  }
}
