import React, { ReactElement, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getClientGatewayUrl, getNetworkId } from 'src/config'
import { addOrUpdateSafe } from 'src/logic/safe/store/actions/addOrUpdateSafe'
import { addressBookAddressesListSelector, addressBookMapSelector } from 'src/logic/addressBook/store/selectors'

const chainId = getNetworkId()

const SafeList = ({ safes }: { safes: any[] }): ReactElement | null => {
  const addressBookMap = useSelector(addressBookMapSelector)

  if (!safes.length) {
    return null
  }

  return (
    <ul>
      {safes.map((safe) => (
        <li key={safe.address}>
          {safe.address} - {addressBookMap?.[chainId]?.[safe.address]?.name ?? 'NN'}
        </li>
      ))}
    </ul>
  )
}

const RecoverSafes = (): ReactElement => {
  const dispatch = useDispatch()
  const addressBookList = useSelector(addressBookAddressesListSelector)
  const [status, setStatus] = useState('Loading...')
  const [safes, setSafes] = useState<any[]>([])

  useEffect(() => {
    const findSafes = async (): Promise<number> => {
      const clientGatewayUrl = getClientGatewayUrl()
      const safes: Promise<any>[] = []
      for (const address of addressBookList) {
        try {
          const result = await fetch(`${clientGatewayUrl}/safes/${address}/`)
          safes.push(result.json())
        } catch (e) {}
      }
      const safesToRecover = await Promise.all(safes)

      setSafes(
        safesToRecover.map(({ address, owners, ...safe }) => ({
          address: address.value,
          owners: owners.map(({ value }) => value),
          loadedViaUrl: false,
          ...safe,
        })),
      )

      return safesToRecover.length
    }

    if (addressBookList.length) {
      setStatus('Finding Safes...')
      findSafes().then((safesCount) => {
        setStatus(`Ready to recover ${safesCount} Safes`)
      })
    }
  }, [addressBookList])

  const recover = () => {
    safes.map((safe) => {
      dispatch(addOrUpdateSafe(safe))
    })
  }

  return (
    <div>
      <h1>Safes recovery</h1>
      <h2>{status}</h2>
      <SafeList safes={safes} />
      <button onClick={recover} disabled={!safes.length}>
        Recover!
      </button>
    </div>
  )
}

export default RecoverSafes
