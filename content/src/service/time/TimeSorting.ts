import { EntityId, Timestamp } from 'tcl-catalyst-commons'
import { Deployment } from '../deployments/DeploymentManager'
import { Entity } from '../Entity'

/** Sort comparable objects from oldest to newest */
export function sortFromOldestToNewest<T extends EntityComparable>(comparableArray: T[]): T[] {
  return comparableArray.sort((event1, event2) => comparatorOldestToNewest(event1, event2))
}

/** Return true if the first object happened before the second one */
function happenedBeforeComparable(comparable1: EntityComparable, comparable2: EntityComparable): boolean {
  return (
    comparable1.timestamp < comparable2.timestamp ||
    (comparable1.timestamp == comparable2.timestamp &&
      comparable1.entityId.toLowerCase() < comparable2.entityId.toLowerCase())
  )
}

/** Return true if the first deployments happened before the second one */
export function happenedBefore(
  toBeComparable1: Deployment | Entity | EntityComparable,
  toBeComparable2: Deployment | Entity | EntityComparable
): boolean {
  const comparable1: EntityComparable = toComparable(toBeComparable1)
  const comparable2: EntityComparable = toComparable(toBeComparable2)
  return happenedBeforeComparable(comparable1, comparable2)
}

function toComparable(toBeComparable: EntityComparable | Deployment | Entity) {
  let comparable: EntityComparable
  if ('auditInfo' in toBeComparable) {
    comparable = { entityId: toBeComparable.entityId, timestamp: toBeComparable.entityTimestamp }
  } else if ('id' in toBeComparable) {
    comparable = { entityId: toBeComparable.id, timestamp: toBeComparable.timestamp }
  } else {
    comparable = toBeComparable
  }
  return comparable
}

function comparatorOldestToNewest(comparable1: EntityComparable, comparable2: EntityComparable) {
  return -1 * comparatorNewestToOldest(comparable1, comparable2)
}

function comparatorNewestToOldest(comparable1: EntityComparable, comparable2: EntityComparable) {
  if (comparable1.entityId == comparable2.entityId) {
    return 0
  } else if (happenedBeforeComparable(comparable2, comparable1)) {
    return -1
  } else {
    return 1
  }
}

type EntityComparable = {
  timestamp: Timestamp
  entityId: EntityId
}
