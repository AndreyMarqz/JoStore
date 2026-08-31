import { useEffect, useState } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import './App.css'
import {
  accentClasses,
  availableCoupons,
  emptyUserProfile,
  fallbackSections,
  fashionCategoryGroups,
  initialAddresses,
  initialPaymentCards,
} from './data/storeData'
import { ChatbotWidget } from './components/ChatbotWidget/ChatbotWidget'
import { CouponModal } from './components/CouponModal/CouponModal'
import { ProductModal } from './components/ProductModal/ProductModal'
import { StoreHeader } from './components/StoreHeader/StoreHeader'
import { Toast } from './components/Toast/Toast'
import { AdminPage } from './pages/AdminPage/AdminPage'
import { CartPage } from './pages/CartPage/CartPage'
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage'
import { HomePage } from './pages/HomePage/HomePage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { ProductPage } from './pages/ProductPage/ProductPage'
import type {
  Address,
  AdminSection,
  CartItem,
  DummyProduct,
  Order,
  PaymentCard,
  ProductCard,
  ProductSection,
  ProfileSection,
  ToastState,
  UserProfile,
  ViewMode,
} from './types/store'
import { buildProductSections, parseFormattedPrice } from './utils/store'
import { loadStoreSession, saveStoreSession } from './utils/localStorage'

function App() {
  const [productSections, setProductSections] = useState<ProductSection[]>(fallbackSections)
  const [productsError, setProductsError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadStoreSession()?.cartItems ?? [])
  const [toast, setToast] = useState<ToastState>(null)
  const [currentView, setCurrentView] = useState<ViewMode>('home')
  const [activeProfileSection, setActiveProfileSection] = useState<ProfileSection>('info')
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('clients')
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>(() => loadStoreSession()?.selectedCouponIds ?? [])
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>(() => loadStoreSession()?.paymentCards ?? initialPaymentCards)
  const [addresses, setAddresses] = useState<Address[]>(() => loadStoreSession()?.addresses ?? initialAddresses)
  const [selectedPaymentCardIds, setSelectedPaymentCardIds] = useState<string[]>(() => loadStoreSession()?.selectedPaymentCardIds ?? [initialPaymentCards[0].id])
  const [selectedAddressId, setSelectedAddressId] = useState(() => loadStoreSession()?.selectedAddressId ?? initialAddresses[0].id)
  const [orders, setOrders] = useState<Order[]>(() => loadStoreSession()?.orders ?? [])
  const [cartAdditions, setCartAdditions] = useState(() => loadStoreSession()?.cartAdditions ?? 0)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadStoreSession()?.userProfile ?? emptyUserProfile)
  const [isProfileRegistered, setIsProfileRegistered] = useState(() => loadStoreSession()?.isProfileRegistered ?? false)

  useEffect(() => {
    saveStoreSession({
      cartItems,
      selectedCouponIds,
      paymentCards,
      addresses,
      selectedPaymentCardIds,
      selectedAddressId,
      orders,
      cartAdditions,
      userProfile: { ...userProfile, password: '' },
      isProfileRegistered,
    })
  }, [
    addresses,
    cartAdditions,
    cartItems,
    isProfileRegistered,
    orders,
    paymentCards,
    selectedAddressId,
    selectedCouponIds,
    selectedPaymentCardIds,
    userProfile,
  ])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setProductsError('')

        const fashionCategories = Array.from(
          new Set([
            ...fashionCategoryGroups.offers,
            ...fashionCategoryGroups.bestSellers,
            ...fashionCategoryGroups.featured,
          ]),
        )

        const responses = await Promise.all(
          fashionCategories.map(async (category) => {
            const response = await fetch(
              `https://dummyjson.com/products/category/${category}?limit=12`,
              { signal: controller.signal },
            )

            if (!response.ok) {
              throw new Error('Não foi possível carregar os produtos.')
            }

            const data: { products: DummyProduct[] } = await response.json()
            return data.products
          }),
        )

        setProductSections(
          buildProductSections(responses.flat(), fashionCategoryGroups, accentClasses),
        )
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setProductsError('Exibindo dados locais enquanto a API de produtos não responde.')
        setProductSections(fallbackSections)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedProduct && !isCouponModalOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (selectedProduct) {
        setSelectedProduct(null)
      } else if (isCouponModalOpen) {
        setIsCouponModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedProduct, isCouponModalOpen])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [currentView])

  useEffect(() => {
    if (currentView !== 'profile' || !isProfileRegistered) {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [currentView, isProfileRegistered])

  const subtotal = cartItems.reduce((total, item) => total + item.totalPriceValue, 0)
  const baseShippingTotal = cartItems.some((item) => item.shipping !== 'Frete grátis') ? 24.9 : 0

  const couponDiscountTotal = availableCoupons.reduce((total, coupon) => {
    if (!selectedCouponIds.includes(coupon.id) || subtotal < coupon.minimumSubtotal) {
      return total
    }

    if (coupon.type === 'percentage') {
      return total + subtotal * (coupon.amount / 100)
    }

    if (coupon.type === 'fixed') {
      return total + coupon.amount
    }

    return total
  }, 0)

  const hasFreeShippingCoupon = availableCoupons.some(
    (coupon) =>
      selectedCouponIds.includes(coupon.id) &&
      subtotal >= coupon.minimumSubtotal &&
      coupon.type === 'shipping',
  )

  const shippingTotal = hasFreeShippingCoupon ? 0 : baseShippingTotal
  const finalTotal = Math.max(0, subtotal + shippingTotal - couponDiscountTotal)

  useEffect(() => {
    setSelectedCouponIds((current) =>
      current.filter((couponId) => {
        const coupon = availableCoupons.find((item) => item.id === couponId)
        return coupon ? subtotal >= coupon.minimumSubtotal : false
      }),
    )
  }, [subtotal])

  function openProductModal(product: ProductCard) {
    setSelectedProduct(product)
    setSelectedQuantity(1)
    setSelectedSize('')
  }

  function closeProductModal() {
    setSelectedProduct(null)
  }

  function openProductPage() {
    if (selectedProduct) {
      setCurrentView('product')
    }
  }

  function closeProductPage() {
    setSelectedProduct(null)
    setCurrentView('home')
  }

  function openHomePage() {
    closeProductModal()
    setIsCouponModalOpen(false)
    setCurrentView('home')
  }

  function openProfilePage(section: ProfileSection = 'info') {
    closeProductModal()
    setIsCouponModalOpen(false)
    setActiveProfileSection(section)
    setCurrentView('profile')
  }

  function openAdminPage(section: AdminSection = 'clients') {
    closeProductModal()
    setIsCouponModalOpen(false)
    setActiveAdminSection(section)
    setCurrentView('admin')
  }

  function requireRegisteredProfile() {
    if (isProfileRegistered) {
      return true
    }

    setToast({
      variant: 'error',
      title: 'Cadastro obrigatório',
      message: 'Você precisa cadastrar seu perfil antes de adicionar produtos ao carrinho ou finalizar a compra.',
    })
    openProfilePage('info')
    return false
  }

  function openCartPage() {
    if (!requireRegisteredProfile()) {
      return
    }

    closeProductModal()
    setCurrentView('cart')
  }

  function openCheckoutPage() {
    if (!requireRegisteredProfile()) {
      return
    }

    if (cartItems.length === 0) {
      setToast({
        variant: 'error',
        title: 'Carrinho vazio',
        message: 'Adicione pelo menos um produto ao carrinho antes de finalizar a compra.',
      })
      return
    }

    setIsCouponModalOpen(false)
    setCurrentView('checkout')
  }

  function handleToggleCoupon(couponId: string) {
    const coupon = availableCoupons.find((item) => item.id === couponId)

    if (!coupon || subtotal < coupon.minimumSubtotal) {
      return
    }

    setSelectedCouponIds((current) =>
      current.includes(couponId)
        ? current.filter((id) => id !== couponId)
        : [...current, couponId],
    )
  }

  function addProductToCart(product: ProductCard, quantityToAdd: number, size = selectedSize) {
    const unitPriceValue = parseFormattedPrice(product.price)
    const totalPriceValue = unitPriceValue * quantityToAdd

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id && item.size === size)

      if (existingItem) {
        return currentItems.map((item) => {
          if (item.id !== product.id) {
            return item
          }

          const quantity = item.quantity + quantityToAdd
          const updatedTotal = item.unitPriceValue * quantity

          return {
            ...item,
            quantity,
            totalPriceValue: updatedTotal,
            totalPrice: updatedTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          }
        })
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: quantityToAdd,
          size,
          unitPriceValue,
          totalPriceValue,
          totalPrice: totalPriceValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
        },
      ]
    })

    setCartAdditions((current) => current + quantityToAdd)

    return totalPriceValue
  }

  function handleAddToCart() {
    if (!selectedProduct || !requireRegisteredProfile()) {
      return
    }

    if (!selectedSize) {
      setToast({ variant: 'error', title: 'Selecione um tamanho', message: 'Escolha o tamanho antes de adicionar o produto ao carrinho.' })
      return
    }

    const totalPriceValue = addProductToCart(selectedProduct, selectedQuantity)

    setToast({
      variant: 'success',
      title: 'Produto adicionado ao carrinho',
      message: `${selectedProduct.name} x${selectedQuantity} • Total ${totalPriceValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}`,
    })
  }

  function handleBuyNow() {
    if (!selectedProduct || !requireRegisteredProfile()) {
      return
    }

    if (!selectedSize) {
      setToast({ variant: 'error', title: 'Selecione um tamanho', message: 'Escolha o tamanho antes de continuar com a compra.' })
      return
    }

    addProductToCart(selectedProduct, selectedQuantity)
    closeProductModal()
    setIsCouponModalOpen(false)
    setCurrentView('checkout')
  }

  function handleUpdateCartItemQuantity(itemId: number, nextQuantity: number) {
    if (nextQuantity < 1) {
      handleRemoveCartItem(itemId)
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        const totalPriceValue = item.unitPriceValue * nextQuantity

        return {
          ...item,
          quantity: nextQuantity,
          totalPriceValue,
          totalPrice: totalPriceValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
        }
      }),
    )
  }

  function handleRemoveCartItem(itemId: number) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  function handleTogglePaymentCard(cardId: string) {
    setSelectedPaymentCardIds((current) =>
      current.includes(cardId)
        ? current.length === 1
          ? current
          : current.filter((id) => id !== cardId)
        : [...current, cardId],
    )
  }

  function handleAddPaymentCard(card: Omit<PaymentCard, 'id'>) {
    const nextCard = { ...card, id: `card-${crypto.randomUUID()}` }
    setPaymentCards((current) => [...current, nextCard])
    setSelectedPaymentCardIds((current) => [...current, nextCard.id])
  }

  function handleAddAddress(address: Omit<Address, 'id'>) {
    const nextAddress = { ...address, id: `address-${crypto.randomUUID()}` }
    setAddresses((current) => [...current, nextAddress])
    setSelectedAddressId(nextAddress.id)
  }

  function handleConfirmPurchase() {
    if (cartItems.length === 0) {
      setToast({
        variant: 'error',
        title: 'Compra não concluída',
        message: 'Adicione produtos ao carrinho antes de confirmar o pagamento.',
      })
      return
    }

    const selectedCards = paymentCards.filter((card) => selectedPaymentCardIds.includes(card.id))
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId)

    if (selectedCards.length === 0) {
      setToast({
        variant: 'error',
        title: 'Compra não concluída',
        message: 'Selecione ao menos um cartão para realizar o pedido.',
      })
      return
    }

    if (!selectedAddress) {
      setToast({
        variant: 'error',
        title: 'Compra não concluída',
        message: 'Selecione um endereço de entrega para continuar.',
      })
      return
    }

    const orderNumber = `#${String(orders.length + 1).padStart(5, '0')}`
    const createdAt = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date())

    const nextOrder: Order = {
      id: `order-${crypto.randomUUID()}`,
      number: orderNumber,
      createdAt,
      status: 'EM ABERTO',
      items: cartItems,
      paymentCards: selectedCards,
      address: selectedAddress,
      subtotal,
      shippingTotal,
      discountTotal: couponDiscountTotal,
      total: finalTotal,
    }

    setOrders((current) => [nextOrder, ...current])
    setCartItems([])
    setSelectedCouponIds([])
    setToast({
      variant: 'success',
      title: 'Pedido realizado com sucesso',
      message: `${orderNumber} foi realizado com sucesso.`,
    })
    openHomePage()
  }

  function handleCancelOrder(orderId: string) {
    let cancelledOrderNumber = ''

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order
        }

        cancelledOrderNumber = order.number
        return { ...order, status: 'PEDIDO CANCELADO' }
      }),
    )

    setToast({
      variant: 'success',
      title: 'Pedido cancelado',
      message: `${cancelledOrderNumber} foi cancelado com sucesso.`,
    })
  }

  function handleConfirmOrderReceived(orderId: string) {
    let receivedOrderNumber = ''

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order
        }

        receivedOrderNumber = order.number
        return { ...order, status: 'PEDIDO RECEBIDO' }
      }),
    )

    setToast({
      variant: 'success',
      title: 'Recebimento confirmado',
      message: `${receivedOrderNumber} foi marcado como recebido.`,
    })
  }

  function handleRequestOrderExchange(orderId: string) {
    let exchangedOrderNumber = ''

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order
        }

        exchangedOrderNumber = order.number
        return { ...order, status: 'TROCA SOLICITADA' }
      }),
    )

    setToast({
      variant: 'success',
      title: 'Troca solicitada',
      message: `${exchangedOrderNumber} foi enviado para análise de troca.`,
    })
  }

  function handleUpdateProfile(profile: UserProfile) {
    setUserProfile(profile)
  }

  function handleRegisterProfile(profile: UserProfile) {
    setUserProfile(profile)
    setIsProfileRegistered(true)
    setActiveProfileSection('info')
  }

  function handleToggleProfileStatus() {
    setUserProfile((current) => ({
      ...current,
      status: current.status === 'Ativo' ? 'Inativo' : 'Ativo',
    }))
  }

  function handleAdminUpdateOrderStatus(orderId: string, nextStatus: string) {
    let updatedOrderNumber = ''

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) {
          return order
        }

        updatedOrderNumber = order.number
        return { ...order, status: nextStatus }
      }),
    )

    setToast({
      variant: 'success',
      title: 'Status atualizado',
      message: `${updatedOrderNumber} agora está como ${nextStatus}.`,
    })
  }

  const registeredClients = isProfileRegistered ? [userProfile] : []
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="app-shell">
      <StoreHeader
        cartItemsCount={cartItemsCount}
        isOverlay={currentView === 'home'}
        onHome={openHomePage}
        onOpenCart={openCartPage}
        onOpenAdmin={() => openAdminPage('clients')}
        onOpenProfile={() => openProfilePage('info')}
      />

      <main className="store-main">
        {currentView === 'home' ? (
          <HomePage
            productSections={productSections}
            productsError={productsError}
            onProductSelect={openProductModal}
          />
        ) : null}

        {currentView === 'product' && selectedProduct ? (
          <ProductPage
            product={selectedProduct}
            quantity={selectedQuantity}
            selectedSize={selectedSize}
            onBack={closeProductPage}
            onQuantityChange={setSelectedQuantity}
            onDecrease={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
            onIncrease={() => setSelectedQuantity((quantity) => quantity + 1)}
            onSelectSize={setSelectedSize}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ) : null}

        {currentView === 'cart' ? (
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

        {currentView === 'checkout' ? (
          <CheckoutPage
            cartItems={cartItems}
            paymentCards={paymentCards}
            addresses={addresses}
            selectedPaymentCardIds={selectedPaymentCardIds}
            selectedAddressId={selectedAddressId}
            selectedCouponsCount={selectedCouponIds.length}
            subtotal={subtotal}
            shippingTotal={shippingTotal}
            couponDiscountTotal={couponDiscountTotal}
            finalTotal={finalTotal}
            onBackToCart={openCartPage}
            onOpenCoupons={() => setIsCouponModalOpen(true)}
            onTogglePaymentCard={handleTogglePaymentCard}
            onSelectAddress={setSelectedAddressId}
            onAddPaymentCard={handleAddPaymentCard}
            onAddAddress={handleAddAddress}
            onShowToast={setToast}
            onConfirmPurchase={handleConfirmPurchase}
          />
        ) : null}

        {currentView === 'profile' ? (
          <ProfilePage
            orders={orders}
            userProfile={userProfile}
            isProfileRegistered={isProfileRegistered}
            activeSection={activeProfileSection}
            onSelectSection={setActiveProfileSection}
            onCancelOrder={handleCancelOrder}
            onConfirmOrderReceived={handleConfirmOrderReceived}
            onRequestOrderExchange={handleRequestOrderExchange}
            onRegisterProfile={handleRegisterProfile}
            onUpdateProfile={handleUpdateProfile}
            onToggleProfileStatus={handleToggleProfileStatus}
            onShowToast={setToast}
          />
        ) : null}

        {currentView === 'admin' ? (
          <AdminPage
            clients={registeredClients}
            orders={orders}
            cartAdditions={cartAdditions}
            activeSection={activeAdminSection}
            onSelectSection={setActiveAdminSection}
            onUpdateOrderStatus={handleAdminUpdateOrderStatus}
          />
        ) : null}
      </main>

      <ProductModal
        product={currentView === 'product' ? null : selectedProduct}
        onClose={closeProductModal}
        onViewProduct={openProductPage}
      />

      <Toast toast={toast} />

      <CouponModal
        isOpen={isCouponModalOpen}
        subtotal={subtotal}
        selectedCouponIds={selectedCouponIds}
        onClose={() => setIsCouponModalOpen(false)}
        onToggleCoupon={handleToggleCoupon}
      />

      <ChatbotWidget />
    </div>
  )
}

export default App
