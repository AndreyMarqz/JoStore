import type { PropsWithChildren } from "react";
import { mockCustomerGateway } from "./customerGateway";
import { CustomerGatewayContext } from "./customerGatewayContext";

export function CustomerGatewayProvider({ children }: PropsWithChildren) {
  return (
    <CustomerGatewayContext.Provider value={mockCustomerGateway}>
      {children}
    </CustomerGatewayContext.Provider>
  );
}
