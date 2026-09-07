import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CustomerGatewayProvider } from "./services/CustomerGatewayProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CustomerGatewayProvider>
      <App />
    </CustomerGatewayProvider>
  </React.StrictMode>,
);
