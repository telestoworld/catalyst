import { ContentFileHash, EntityId, EntityType, Pointer, Timestamp } from 'tcl-catalyst-commons'

export type Entity = {
  id: EntityId
  type: EntityType
  pointers: Pointer[]
  timestamp: Timestamp
  content?: Map<string, ContentFileHash>
  metadata?: any
}
