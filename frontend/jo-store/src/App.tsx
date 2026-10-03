import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "./App.css";
import { accentClasses, fallbackSections } from "./data/storeData";
import { ChatbotWidget } from "./components/ChatbotWidget/ChatbotWidget";
import { CouponModal } from "./components/CouponModal/CouponModal";
import { ProductModal } from "./components/ProductModal/ProductModal";
import { StoreHeader } from "./components/StoreHeader/StoreHeader";
import { StoreFooter } from "./components/StoreFooter/StoreFooter";
import { Toast } from "./components/Toast/Toast";
import { AdminPage } from "./pages/AdminPage/AdminPage";
import { CartPage } from "./pages/CartPage/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage/CheckoutPage";
import { HomePage } from "./pages/HomePage/HomePage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { ClientProfilePage } from "./pages/ProfilePage/ClientProfilePage";
import { ClientRegistrationPage } from "./pages/ProfilePage/ClientRegistrationPage";
import { ProductPage } from "./pages/ProductPage/ProductPage";
import type {
  AdminSection,
  CartItem,
  Coupon,
  Order,
  ProductCard,
  ProductSection,
  ClientAddress,
  ClientCard,
  ClientDetails,
  ToastState,
  ViewMode,
} from "./types/store";
import {
  clearSession,
  getStoredSession,
  saveSession,
} from "./services/authSession";
import {
  orderGateway,
  type ApiCart,
  type ApiCartItem,
  type ApiProduct,
  type CardPayment,
} from "./services/orderGateway";
import { CustomerGatewayError } from "./services/customerGateway";
import { useCustomerGateway } from "./services/useCustomerGateway";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mapProduct(product: ApiProduct, index = 0): ProductCard {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: formatCurrency(product.price),
    shipping: "Frete calculado no checkout",
    accent: accentClasses[index % accentClasses.length],
    image: product.imageUrl ?? "",
    images: product.imageUrl ? [product.imageUrl] : [],
  };
}

function mapCartItem(item: ApiCartItem, index = 0): CartItem {
  const product = mapProduct(item.product, index);
  return {
    ...product,
    cartItemId: item.id,
    quantity: item.quantity,
    size: item.size,
    unitPriceValue: item.unitPrice,
    totalPriceValue: item.total,
    totalPrice: formatCurrency(item.total),
  };
}

function mapCart(cart: ApiCart): CartItem[] {
  return cart.items.map(mapCartItem);
}

function productSlug(product: ProductCard) {
  return product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const pathsByView: Record<Exclude<ViewMode, "product">, string> = {
  home: "/",
  cart: "/carrinho",
  checkout: "/checkout",
  profile: "/perfil",
  admin: "/admin",
};

function viewFromPath(pathname: string): ViewMode {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/login" || path === "/cadastro") return "profile";
  if (/^\/produto\/[^/]+$/.test(path)) return "product";
  return (
    (Object.entries(pathsByView).find(([, value]) => value === path)?.[0] as
      | ViewMode
      | undefined) ?? "home"
  );
}

function App() {
  const customerGateway = useCustomerGateway();
  const [productSections, setProductSections] =
    useState<ProductSection[]>(fallbackSections);
  const [productsError, setProductsError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(
    null,
  );
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(() =>
    viewFromPath(window.location.pathname),
  );
  const [activeClient, setActiveClient] = useState<ClientDetails | null>(
    getStoredSession,
  );
  const [profileMode, setProfileMode] = useState<"login" | "register">(() =>
    window.location.pathname === "/cadastro" ? "register" : "login",
  );
  const [activeAdminSection, setActiveAdminSection] =
    useState<AdminSection>("clients");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  function navigate(
    view: Exclude<ViewMode, "product">,
    path = pathsByView[view],
  ) {
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, "", path);
    }
    setCurrentView(view);
  }

  useEffect(() => {
    function handlePopState() {
      const view = viewFromPath(window.location.pathname);
      if (view === "product") {
        const productId = window.location.pathname.match(/^\/produto\/([^/]+)$/)?.[1];
        const product = productSections
          .flatMap((section) => section.products)
          .find((item) => productSlug(item) === productId);
        if (product) setSelectedProduct(product);
      } else {
        setSelectedProduct(null);
      }
      setCurrentView(view);
      if (window.location.pathname === "/cadastro") setProfileMode("register");
      if (window.location.pathname === "/login") setProfileMode("login");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [productSections]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/produto\/([^/]+)$/);
    if (!match) return;

    const product = productSections
      .flatMap((section) => section.products)
      .find((item) => productSlug(item) === match[1]);
    if (product) {
      setSelectedProduct(product);
      setCurrentView("product");
      return;
    }

    if (productsError) {
      window.history.replaceState({ view: "home" }, "", "/");
      setCurrentView("home");
    }
  }, [productSections, productsError]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setProductsError("");
        const products = await orderGateway.listProducts();
        const cards = products.map(mapProduct);
        setProductSections([
          { id: "ofertas", title: "Ofertas", products: cards.slice(0, 5) },
          {
            id: "mais-vendidos",
            title: "Mais vendidos",
            products: cards.slice(5, 10),
          },
          {
            id: "destaques",
            title: "Destaques",
            products: cards.slice(10, 15),
          },
        ]);
      } catch {
        setProductsError(
          "Exibindo dados locais enquanto a API de produtos não responde.",
        );
        setProductSections(fallbackSections);
      }
    }

    void loadCatalog();
    return;

    /* Legacy remote-placeholder loader retained temporarily below for reference.
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setProductsError("");

        const fashionCategories = Array.from(
          new Set([
            ...fashionCategoryGroups.offers,
            ...fashionCategoryGroups.bestSellers,
            ...fashionCategoryGroups.featured,
          ]),
        );

        const responses = await Promise.all(
          fashionCategories.map(async (category) => {
            const response = await fetch(
              `https://dummyjson.com/products/category/${category}?limit=12`,
              { signal: controller.signal },
            );

            if (!response.ok) {
              throw new Error("Não foi possível carregar os produtos.");
            }

            const data: { products: DummyProduct[] } = await response.json();
            return data.products;
          }),
        );

        setProductSections(
          buildProductSections(
            responses.flat(),
            fashionCategoryGroups,
            accentClasses,
          ),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setProductsError(
          "Exibindo dados locais enquanto a API de produtos não responde.",
        );
        setProductSections(fallbackSections);
      }
    }

    loadProducts();
    return () => controller.abort(); */
  }, []);

  useEffect(() => {
    if (!activeClient) {
      setCartItems([]);
      setAvailableCoupons([]);
      setSelectedCouponIds([]);
      return;
    }

    void Promise.all([
      orderGateway.getCart(activeClient.id),
      orderGateway.listCoupons(activeClient.id),
    ])
      .then(([cart, coupons]) => {
        setCartItems(mapCart(cart));
        setAvailableCoupons(
          coupons.map((coupon) => ({
            id: coupon.id,
            code: coupon.code,
            title:
              coupon.type === "TROCA" ? "Cupom de troca" : "Cupom promocional",
            discountLabel: formatCurrency(coupon.value),
            description: coupon.description,
            minimumSubtotal: 0,
            type: coupon.type,
            amount: coupon.value,
          })),
        );
      })
      .catch(() => undefined);
  }, [activeClient?.id]);

  useEffect(() => {
    if (!selectedProduct && !isCouponModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (selectedProduct) {
        setSelectedProduct(null);
      } else if (isCouponModalOpen) {
        setIsCouponModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct, isCouponModalOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (activeClient) {
      saveSession(activeClient);
    } else {
      clearSession();
    }
  }, [activeClient]);

  useEffect(() => {
    if (!activeClient) {
      return;
    }

    let cancelled = false;

    void customerGateway.getClientById(activeClient.id).catch((error) => {
      if (
        cancelled ||
        !(error instanceof CustomerGatewayError) ||
        error.status !== 404
      ) {
        return;
      }

      // O banco da API pode ter sido recriado enquanto a sessão permanecia
      // salva no navegador. Não mantenha um UUID de cliente inexistente.
      setActiveClient(null);
      setProfileMode("login");
      navigate("profile", "/login");
      setToast({
        variant: "error",
        title: "Sessão desatualizada",
        message:
          "Seu cadastro não foi encontrado na API atual. Entre novamente ou crie sua conta.",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, customerGateway]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentView]);

  useEffect(() => {
    if (currentView !== "profile" || !activeClient) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeClient, currentView]);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.totalPriceValue,
    0,
  );
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const selectedDeliveryState = activeClient?.addresses.find((address) =>
    address.roles.includes("Entrega"),
  )?.state;
  const baseShippingTotal =
    cartItems.length === 0
      ? 0
      : 15 +
        itemCount * 2 +
        (selectedDeliveryState && selectedDeliveryState !== "SP" ? 10 : 0);
  const couponDiscountTotal = availableCoupons
    .filter((coupon) => selectedCouponIds.includes(coupon.id))
    .reduce((total, coupon) => total + coupon.amount, 0);
  const shippingTotal = baseShippingTotal;
  const finalTotal = Math.max(
    0,
    subtotal + shippingTotal - couponDiscountTotal,
  );

  function openProductModal(product: ProductCard) {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setSelectedSize("");
  }

  function closeProductModal() {
    setSelectedProduct(null);
  }

  function openProductPage() {
    if (selectedProduct) {
      window.history.pushState(
        { view: "product", productId: selectedProduct.id },
        "",
        `/produto/${productSlug(selectedProduct)}`,
      );
      setCurrentView("product");
    }
  }

  function closeProductPage() {
    setSelectedProduct(null);
    navigate("home");
  }

  function openHomePage() {
    closeProductModal();
    setIsCouponModalOpen(false);
    navigate("home");
  }

  function openProfilePage() {
    closeProductModal();
    setIsCouponModalOpen(false);
    if (!activeClient) {
      setProfileMode("login");
      navigate("profile", "/login");
      return;
    }
    navigate("profile");
  }

  function openAdminPage(section: AdminSection = "clients") {
    closeProductModal();
    setIsCouponModalOpen(false);
    setActiveAdminSection(section);
    navigate("admin");
  }

  function requireRegisteredProfile() {
    if (activeClient) {
      return true;
    }

    setToast({
      variant: "error",
      title: "Cadastro obrigatório",
      message:
        "Você precisa cadastrar seu perfil antes de adicionar produtos ao carrinho ou finalizar a compra.",
    });
    openProfilePage();
    return false;
  }

  function openCartPage() {
    if (!requireRegisteredProfile()) {
      return;
    }

    closeProductModal();
    navigate("cart");
  }

  function openCheckoutPage() {
    if (!requireRegisteredProfile()) {
      return;
    }

    if (cartItems.length === 0) {
      setToast({
        variant: "error",
        title: "Carrinho vazio",
        message:
          "Adicione pelo menos um produto ao carrinho antes de finalizar a compra.",
      });
      return;
    }

    setIsCouponModalOpen(false);
    navigate("checkout");
  }

  function handleToggleCoupon(couponId: string) {
    const coupon = availableCoupons.find((item) => item.id === couponId);

    if (!coupon || subtotal < coupon.minimumSubtotal) {
      return;
    }

    setSelectedCouponIds((current) => {
      if (current.includes(couponId))
        return current.filter((id) => id !== couponId);
      const alreadyHasPromotional = availableCoupons.some(
        (item) => current.includes(item.id) && item.type === "PROMOCIONAL",
      );
      if (coupon.type === "PROMOCIONAL" && alreadyHasPromotional) {
        setToast({
          variant: "error",
          title: "Cupom não aplicado",
          message: "A compra permite apenas um cupom promocional.",
        });
        return current;
      }
      return [...current, couponId];
    });
  }

  async function addProductToCart(
    product: ProductCard,
    quantityToAdd: number,
    size = selectedSize,
  ) {
    if (!activeClient) return;
    const cart = await orderGateway.addCartItem(
      activeClient.id,
      product.id,
      size,
      quantityToAdd,
    );
    setCartItems(mapCart(cart));
  }

  async function handleAddToCart() {
    if (!selectedProduct || !requireRegisteredProfile()) {
      return;
    }

    if (!selectedSize) {
      setToast({
        variant: "error",
        title: "Selecione um tamanho",
        message: "Escolha o tamanho antes de adicionar o produto ao carrinho.",
      });
      return;
    }

    const totalPriceValue =
      selectedQuantity *
      Number(selectedProduct.price.replace(/[^\d,]/g, "").replace(",", "."));
    try {
      await addProductToCart(selectedProduct, selectedQuantity);
    } catch (error) {
      setToast({
        variant: "error",
        title: "Carrinho não atualizado",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Não foi possível adicionar o produto.",
      });
      return;
    }

    setToast({
      variant: "success",
      title: "Produto adicionado ao carrinho",
      message: `${selectedProduct.name} x${selectedQuantity} • Total ${totalPriceValue.toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        },
      )}`,
    });
  }

  async function handleBuyNow() {
    if (!selectedProduct || !requireRegisteredProfile()) {
      return;
    }

    if (!selectedSize) {
      setToast({
        variant: "error",
        title: "Selecione um tamanho",
        message: "Escolha o tamanho antes de continuar com a compra.",
      });
      return;
    }

    try {
      await addProductToCart(selectedProduct, selectedQuantity);
    } catch (error) {
      setToast({
        variant: "error",
        title: "Carrinho não atualizado",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Não foi possível adicionar o produto.",
      });
      return;
    }
    closeProductModal();
    setIsCouponModalOpen(false);
    navigate("checkout");
  }

  async function handleUpdateCartItemQuantity(
    itemId: string,
    nextQuantity: number,
  ) {
    if (nextQuantity < 1) {
      handleRemoveCartItem(itemId);
      return;
    }

    const item = cartItems.find((current) => current.cartItemId === itemId);
    if (!activeClient || !item) return;
    try {
      const cart = await orderGateway.updateCartItem(
        activeClient.id,
        itemId,
        item.id,
        item.size,
        nextQuantity,
      );
      setCartItems(mapCart(cart));
    } catch (error) {
      setToast({
        variant: "error",
        title: "Quantidade não atualizada",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Não foi possível atualizar o carrinho.",
      });
    }
  }

  async function handleRemoveCartItem(itemId: string) {
    if (!activeClient) return;
    try {
      await orderGateway.removeCartItem(activeClient.id, itemId);
      setCartItems((currentItems) =>
        currentItems.filter((item) => item.cartItemId !== itemId),
      );
    } catch (error) {
      setToast({
        variant: "error",
        title: "Item não removido",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Não foi possível remover o item.",
      });
    }
  }

  async function handleConfirmPurchase(
    cards: ClientCard[],
    address: ClientAddress,
    cardPayments: CardPayment[],
  ) {
    if (!activeClient) return;
    try {
      const order = await orderGateway.createOrder(
        activeClient.id,
        address.id,
        selectedCouponIds,
        cardPayments,
      );
      const createdAt = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(order.createdAt));
      setOrders((current) => [
        {
          id: order.id,
          number: `#${order.code.replace("PED-", "")}`,
          createdAt,
          status: "EM PROCESSAMENTO",
          items: cartItems,
          paymentCards: cards,
          address,
          subtotal: order.subtotal,
          shippingTotal: order.shipping,
          discountTotal: order.couponDiscount,
          total: order.total,
        },
        ...current,
      ]);
      setCartItems([]);
      setSelectedCouponIds([]);
      const coupons = await orderGateway.listCoupons(activeClient.id);
      setAvailableCoupons(
        coupons.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          title:
            coupon.type === "TROCA" ? "Cupom de troca" : "Cupom promocional",
          discountLabel: formatCurrency(coupon.value),
          description: coupon.description,
          minimumSubtotal: 0,
          type: coupon.type,
          amount: coupon.value,
        })),
      );
      setToast({
        variant: "success",
        title: "Pedido realizado",
        message: `${order.code} foi registrado com status EM PROCESSAMENTO.`,
      });
      openHomePage();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Compra não concluída",
        message:
          error instanceof CustomerGatewayError
            ? error.message
            : "Não foi possível concluir o pedido.",
      });
    }
    return;

    if (cartItems.length === 0) {
      setToast({
        variant: "error",
        title: "Compra não concluída",
        message:
          "Adicione produtos ao carrinho antes de confirmar o pagamento.",
      });
      return;
    }

    const selectedCards = cards;
    const selectedAddress = address;

    if (selectedCards.length === 0) {
      setToast({
        variant: "error",
        title: "Compra não concluída",
        message: "Selecione ao menos um cartão para realizar o pedido.",
      });
      return;
    }

    if (!selectedAddress) {
      setToast({
        variant: "error",
        title: "Compra não concluída",
        message: "Selecione um endereço de entrega para continuar.",
      });
      return;
    }

    const orderNumber = `#${String(orders.length + 1).padStart(5, "0")}`;
    const createdAt = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const nextOrder: Order = {
      id: `order-${crypto.randomUUID()}`,
      number: orderNumber,
      createdAt,
      status: "EM ABERTO",
      items: cartItems,
      paymentCards: selectedCards,
      address: selectedAddress,
      subtotal,
      shippingTotal,
      discountTotal: couponDiscountTotal,
      total: finalTotal,
    };

    setOrders((current) => [nextOrder, ...current]);
    setCartItems([]);
    setSelectedCouponIds([]);
    setToast({
      variant: "success",
      title: "Pedido realizado com sucesso",
      message: `${orderNumber} foi realizado com sucesso.`,
    });
    openHomePage();
  }

  function handleCancelOrder(orderId: string) {
    let cancelledOrderNumber = "";

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        cancelledOrderNumber = order.number;
        return { ...order, status: "PEDIDO CANCELADO" };
      }),
    );

    setToast({
      variant: "success",
      title: "Pedido cancelado",
      message: `${cancelledOrderNumber} foi cancelado com sucesso.`,
    });
  }

  function handleConfirmOrderReceived(orderId: string) {
    let receivedOrderNumber = "";

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        receivedOrderNumber = order.number;
        return { ...order, status: "PEDIDO RECEBIDO" };
      }),
    );

    setToast({
      variant: "success",
      title: "Recebimento confirmado",
      message: `${receivedOrderNumber} foi marcado como recebido.`,
    });
  }

  function handleRequestOrderExchange(orderId: string) {
    let exchangedOrderNumber = "";

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        exchangedOrderNumber = order.number;
        return { ...order, status: "TROCA SOLICITADA" };
      }),
    );

    setToast({
      variant: "success",
      title: "Troca solicitada",
      message: `${exchangedOrderNumber} foi enviado para análise de troca.`,
    });
  }

  function handleClientRegistered(client: ClientDetails) {
    setActiveClient(client);
    setProfileMode("login");
    navigate("profile");
  }

  function handleClientAuthenticated(client: ClientDetails) {
    setActiveClient(client);
    navigate("profile");
  }

  function handleAdminClientChanged(client: ClientDetails) {
    if (activeClient?.id !== client.id) {
      return;
    }

    saveSession(client);
    setActiveClient(client);
  }

  function handleLogout() {
    setActiveClient(null);
    setProfileMode("login");
    navigate("profile", "/login");
  }

  function handleAdminUpdateOrderStatus(orderId: string, nextStatus: string) {
    let updatedOrderNumber = "";

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        updatedOrderNumber = order.number;
        return { ...order, status: nextStatus };
      }),
    );

    setToast({
      variant: "success",
      title: "Status atualizado",
      message: `${updatedOrderNumber} agora está como ${nextStatus}.`,
    });
  }

  const cartItemsCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const showStoreHeader = currentView !== "profile" || activeClient !== null;

  return (
    <div className="app-shell">
      {showStoreHeader ? (
        <StoreHeader
          cartItemsCount={cartItemsCount}
          isOverlay={currentView === "home"}
          onHome={openHomePage}
          onOpenCart={openCartPage}
          onOpenAdmin={() => openAdminPage("clients")}
          onOpenProfile={openProfilePage}
        />
      ) : null}

      <main className="store-main">
        {currentView === "home" ? (
          <HomePage
            productSections={productSections}
            productsError={productsError}
            onProductSelect={openProductModal}
          />
        ) : null}

        {currentView === "product" && selectedProduct ? (
          <ProductPage
            product={selectedProduct}
            quantity={selectedQuantity}
            selectedSize={selectedSize}
            onBack={closeProductPage}
            onQuantityChange={setSelectedQuantity}
            onDecrease={() =>
              setSelectedQuantity((quantity) => Math.max(1, quantity - 1))
            }
            onIncrease={() => setSelectedQuantity((quantity) => quantity + 1)}
            onSelectSize={setSelectedSize}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ) : null}

        {currentView === "cart" ? (
          <CartPage
            cartItems={cartItems}
            onBackToHome={openHomePage}
            onOpenCoupons={() => setIsCouponModalOpen(true)}
            onUpdateItemQuantity={handleUpdateCartItemQuantity}
            onRemoveItem={handleRemoveCartItem}
            subtotal={subtotal}
            shippingTotal={shippingTotal}
            couponDiscountTotal={couponDiscountTotal}
            finalTotal={finalTotal}
            selectedCouponsCount={selectedCouponIds.length}
            onProceedToCheckout={openCheckoutPage}
          />
        ) : null}

        {currentView === "checkout" && activeClient ? (
          <CheckoutPage
            client={activeClient}
            selectedCouponsCount={selectedCouponIds.length}
            subtotal={subtotal}
            shippingTotal={shippingTotal}
            couponDiscountTotal={couponDiscountTotal}
            finalTotal={finalTotal}
            onBackToCart={openCartPage}
            onOpenCoupons={() => setIsCouponModalOpen(true)}
            onClientChanged={(client) =>
              setActiveClient((current) =>
                current?.id === client.id ? client : current,
              )
            }
            onShowToast={setToast}
            onConfirmPurchase={handleConfirmPurchase}
          />
        ) : null}

        {currentView === "profile" ? (
          activeClient ? (
            <ClientProfilePage
              client={activeClient}
              orders={orders}
              onClientChanged={setActiveClient}
              onLogout={handleLogout}
              onCancelOrder={handleCancelOrder}
              onConfirmOrderReceived={handleConfirmOrderReceived}
              onRequestOrderExchange={handleRequestOrderExchange}
              onShowToast={setToast}
            />
          ) : profileMode === "register" ? (
            <ClientRegistrationPage
              onRegistered={handleClientRegistered}
              onBackToLogin={() => {
                setProfileMode("login");
                navigate("profile", "/login");
              }}
              onShowToast={setToast}
            />
          ) : (
            <LoginPage
              onAuthenticated={handleClientAuthenticated}
              onCreateAccount={() => {
                setProfileMode("register");
                navigate("profile", "/cadastro");
              }}
              onShowToast={setToast}
            />
          )
        ) : null}

        {currentView === "admin" ? (
          <AdminPage
            orders={orders}
            activeSection={activeAdminSection}
            onSelectSection={setActiveAdminSection}
            onUpdateOrderStatus={handleAdminUpdateOrderStatus}
            onClientChanged={handleAdminClientChanged}
          />
        ) : null}
      </main>

      <StoreFooter compact={currentView !== "home"} />

      <ProductModal
        product={currentView === "product" ? null : selectedProduct}
        onClose={closeProductModal}
        onViewProduct={openProductPage}
      />

      <Toast toast={toast} />

      <CouponModal
        isOpen={isCouponModalOpen}
        coupons={availableCoupons}
        subtotal={subtotal}
        selectedCouponIds={selectedCouponIds}
        onClose={() => setIsCouponModalOpen(false)}
        onToggleCoupon={handleToggleCoupon}
      />

      <ChatbotWidget />
    </div>
  );
}

export default App;
