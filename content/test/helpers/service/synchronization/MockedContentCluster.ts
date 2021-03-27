import { ContentCluster } from '@katalyst/content/service/synchronization/ContentCluster'
import { instance, mock, when } from 'ts-mockito'

export class MockedContentCluster {
  static withRandomAddress(): ContentCluster {
    return this.withAddress('someAddress')
  }

  static withoutIdentity(): ContentCluster {
    const mocketcluster: ContentCluster = mock(ContentCluster)
    when(mocketcluster.getIdentityInDAO()).thenReturn(undefined)
    return instance(mocketcluster)
  }

  static withAddress(ethAddress: string): ContentCluster {
    const mocketcluster: ContentCluster = mock(ContentCluster)
    when(mocketcluster.getIdentityInDAO()).thenReturn({ owner: ethAddress, address: '', id: '', name: '' })
    return instance(mocketcluster)
  }

  static withName(name: string): ContentCluster {
    const mocketcluster: ContentCluster = mock(ContentCluster)
    when(mocketcluster.getIdentityInDAO()).thenReturn({ owner: '', address: '', id: '', name })
    return instance(mocketcluster)
  }
}
