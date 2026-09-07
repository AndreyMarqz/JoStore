import { useContext } from 'react'
import { CustomerGatewayContext } from './customerGatewayContext'

export function useCustomerGateway() {
  const gateway = useContext(CustomerGatewayContext)

  if (!gateway) {
    throw new Error(
      'useCustomerGateway deve ser usado dentro de CustomerGatewayProvider.',
    )
  }

  return gateway
}
