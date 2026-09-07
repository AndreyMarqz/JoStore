import { createContext } from 'react'
import type { CustomerGateway } from './customerGateway'

export const CustomerGatewayContext = createContext<CustomerGateway | null>(null)
