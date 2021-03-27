import { buildStatic } from 'dcl-ops-lib/buildStatic'
import { env } from 'dcl-ops-lib/domain'
import { globalConfig } from 'dcl-ops-lib/values'

const { defaultSecurityGroupName } = globalConfig[env]

async function main() {
  const builder = buildStatic({
    domain: `catalysts.telesto.world`
  })

  return {
    cloudfrontDistribution: builder.cloudfrontDistribution,
    bucketName: builder.contentBucket
  }
}
export = main
