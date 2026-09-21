import type { PropsWithChildren } from "react";
import { mockCustomerGateway } from "./customerGateway";
import { CustomerGatewayContext } from "./customerGatewayContext";
import { httpCustomerGateway } from "./httpCustomerGateway";

export function CustomerGatewayProvider({ children }: PropsWithChildren) {
  const useMockGateway = new URLSearchParams(window.location.search).get("gateway") === "mock";

  return (
    <CustomerGatewayContext.Provider value={useMockGateway ? mockCustomerGateway : httpCustomerGateway}>
      {children}
    </CustomerGatewayContext.Provider>
  );
}
