package com.jostore.dev.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jostore.dev.dto.requests.CardPaymentRequestDto;
import com.jostore.dev.dto.requests.CartItemRequestDto;
import com.jostore.dev.dto.requests.CreateOrderRequestDto;
import com.jostore.dev.dto.requests.OrderQuoteRequestDto;
import com.jostore.dev.dto.responses.AddressResponseDto;
import com.jostore.dev.dto.responses.CartItemResponseDto;
import com.jostore.dev.dto.responses.CartResponseDto;
import com.jostore.dev.dto.responses.CouponResponseDto;
import com.jostore.dev.dto.responses.OrderPaymentResponseDto;
import com.jostore.dev.dto.responses.OrderQuoteResponseDto;
import com.jostore.dev.dto.responses.OrderResponseDto;
import com.jostore.dev.dto.responses.ProductResponseDto;
import com.jostore.dev.exception.BusinessRuleException;
import com.jostore.dev.exception.ResourceNotFoundException;
import com.jostore.dev.model.address.Address;
import com.jostore.dev.model.audit.OperationLog;
import com.jostore.dev.model.cart.CartItem;
import com.jostore.dev.model.cart.ShoppingCart;
import com.jostore.dev.model.coupon.Coupon;
import com.jostore.dev.model.creditCards.CreditCard;
import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.CouponTypeEnum;
import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.order.OrderCoupon;
import com.jostore.dev.model.order.OrderItem;
import com.jostore.dev.model.order.OrderPayment;
import com.jostore.dev.model.order.PurchaseOrder;
import com.jostore.dev.model.product.Inventory;
import com.jostore.dev.model.product.Product;
import com.jostore.dev.repository.AddressRepository;
import com.jostore.dev.repository.CartItemRepository;
import com.jostore.dev.repository.CouponRepository;
import com.jostore.dev.repository.CreditCardRepository;
import com.jostore.dev.repository.CustomerRepository;
import com.jostore.dev.repository.InventoryRepository;
import com.jostore.dev.repository.OperationLogRepository;
import com.jostore.dev.repository.ProductRepository;
import com.jostore.dev.repository.PurchaseOrderRepository;
import com.jostore.dev.repository.ShoppingCartRepository;

@Service
public class OrderService {
    private static final BigDecimal FRETE_BASE = new BigDecimal("15.00");
    private static final BigDecimal FRETE_POR_PECA = new BigDecimal("2.00");
    private static final BigDecimal ADICIONAL_FORA_SP = new BigDecimal("10.00");
    private static final BigDecimal DEZ_REAIS = new BigDecimal("10.00");

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final CreditCardRepository creditCardRepository;
    private final CouponRepository couponRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OperationLogRepository operationLogRepository;

    public OrderService(CustomerRepository customerRepository, ProductRepository productRepository,
            InventoryRepository inventoryRepository, ShoppingCartRepository shoppingCartRepository,
            CartItemRepository cartItemRepository, AddressRepository addressRepository,
            CreditCardRepository creditCardRepository, CouponRepository couponRepository,
            PurchaseOrderRepository purchaseOrderRepository, OperationLogRepository operationLogRepository) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.shoppingCartRepository = shoppingCartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.creditCardRepository = creditCardRepository;
        this.couponRepository = couponRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.operationLogRepository = operationLogRepository;
    }

    @Transactional(readOnly = true)
    public CartResponseDto getCart(UUID customerId) {
        Customer customer = findCustomer(customerId);
        return toCartResponse(shoppingCartRepository.findByCustomerId(customer.getId()).orElse(null));
    }

    @Transactional(readOnly = true)
    public List<CouponResponseDto> listAvailableCoupons(UUID customerId) {
        findCustomer(customerId);
        return couponRepository.findAvailableForCustomer(customerId).stream()
                .map(this::toCouponResponse)
                .toList();
    }

    @Transactional
    public CartResponseDto addItem(UUID customerId, CartItemRequestDto request) {
        Customer customer = findCustomer(customerId);
        Product product = findProduct(request.productId());
        ShoppingCart cart = shoppingCartRepository.findByCustomerId(customerId)
                .orElseGet(() -> shoppingCartRepository.save(new ShoppingCart(customer)));
        String size = normalizedSize(request.size());
        CartItem item = cartItemRepository.findByCartIdAndProductIdAndSize(cart.getId(), product.getId(), size)
                .orElse(null);
        int targetQuantity = request.quantity() + (item == null ? 0 : item.getQuantity());
        validateAvailableQuantity(product, targetQuantity);
        if (item == null)
            cart.addItem(new CartItem(product, size, request.quantity()));
        else
            item.changeQuantity(targetQuantity);
        operationLogRepository.save(new OperationLog(customerId, "INSERT", "ITEM_CARRINHO",
                "Produto " + product.getCode() + ", tamanho " + size + ", quantidade " + targetQuantity));
        return toCartResponse(cart);
    }

    @Transactional
    public CartResponseDto changeItemQuantity(UUID customerId, UUID itemId, CartItemRequestDto request) {
        CartItem item = cartItemRepository.findByIdAndCartCustomerId(itemId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado."));
        if (!item.getProduct().getId().equals(request.productId())
                || !item.getSize().equals(normalizedSize(request.size()))) {
            throw new BusinessRuleException("Produto e tamanho do item do carrinho não podem ser alterados.");
        }
        validateAvailableQuantity(item.getProduct(), request.quantity());
        item.changeQuantity(request.quantity());
        operationLogRepository.save(new OperationLog(customerId, "UPDATE", "ITEM_CARRINHO",
                "Item " + itemId + ", quantidade " + request.quantity()));
        return toCartResponse(item.getCart());
    }

    @Transactional
    public void removeItem(UUID customerId, UUID itemId) {
        CartItem item = cartItemRepository.findByIdAndCartCustomerId(itemId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho não encontrado."));
        item.getCart().removeItem(item);
        operationLogRepository.save(new OperationLog(customerId, "DELETE", "ITEM_CARRINHO", "Item " + itemId));
    }

    @Transactional(readOnly = true)
    public OrderQuoteResponseDto quote(UUID customerId, OrderQuoteRequestDto request) {
        ShoppingCart cart = findCartWithItems(customerId);
        Address address = findDeliveryAddress(customerId, request.deliveryAddressId());
        return quote(cart, address, request.couponIds());
    }

    @Transactional
    public OrderResponseDto createOrder(UUID customerId, CreateOrderRequestDto request) {
        if (request.quote() == null)
            throw new BusinessRuleException("Endereço e cupons da compra são obrigatórios.");
        ShoppingCart cart = findCartWithItems(customerId);
        Address address = findDeliveryAddress(customerId, request.quote().deliveryAddressId());
        validateCartAvailability(cart);
        OrderQuoteResponseDto quote = quote(cart, address, request.quote().couponIds());
        List<CardPaymentRequestDto> payments = request.cardPayments() == null ? List.of() : request.cardPayments();
        validatePayments(customerId, payments, quote);

        Customer customer = findCustomer(customerId);
        PurchaseOrder order = new PurchaseOrder(nextOrderCode(), customer, address, quote.subtotal(), quote.shipping(),
                quote.couponDiscount(), quote.total());
        cart.getItems()
                .forEach(item -> order.addItem(new OrderItem(item.getProduct(), item.getSize(), item.getQuantity())));

        Map<UUID, CreditCard> cards = payments.stream().map(CardPaymentRequestDto::cardId).distinct()
                .collect(Collectors.toMap(Function.identity(), id -> findCard(id, customerId)));
        payments.forEach(
                payment -> order.addPayment(new OrderPayment(cards.get(payment.cardId()), money(payment.amount()))));

        List<Coupon> usedCoupons = resolveCoupons(request.quote().couponIds(), customerId);
        BigDecimal remainingCouponValue = quote.total().add(quote.couponDiscount());
        for (Coupon coupon : usedCoupons) {
            BigDecimal usedValue = coupon.getValue().min(remainingCouponValue);
            order.addCoupon(new OrderCoupon(coupon, usedValue));
            coupon.use();
            remainingCouponValue = remainingCouponValue.subtract(usedValue);
        }

        Coupon generatedCoupon = generateExchangeCouponIfNeeded(usedCoupons, quote.total().add(quote.couponDiscount()),
                customer);
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        new ArrayList<>(cart.getItems()).forEach(cart::removeItem);
        operationLogRepository.save(new OperationLog(customerId, "INSERT", "PEDIDO",
                "Pedido " + saved.getCode() + " criado com status EM_PROCESSAMENTO."));
        return toOrderResponse(saved, generatedCoupon);
    }

    private OrderQuoteResponseDto quote(ShoppingCart cart, Address address, List<UUID> couponIds) {
        if (cart.getItems().isEmpty())
            throw new BusinessRuleException("O carrinho deve possuir ao menos um item para realizar a compra.");
        BigDecimal subtotal = cart.getItems().stream().map(this::itemTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        int quantity = cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal shipping = FRETE_BASE.add(FRETE_POR_PECA.multiply(BigDecimal.valueOf(quantity)));
        if (!"SP".equals(address.getState().name()))
            shipping = shipping.add(ADICIONAL_FORA_SP);
        List<Coupon> coupons = resolveCoupons(couponIds, cart.getCustomer().getId());
        validateCoupons(coupons);
        BigDecimal grossTotal = subtotal.add(shipping);
        validateNoUnnecessaryCoupons(coupons, grossTotal);
        BigDecimal selectedValue = coupons.stream().map(Coupon::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = selectedValue.min(grossTotal);
        return new OrderQuoteResponseDto(money(subtotal), money(shipping), money(discount),
                money(grossTotal.subtract(discount)),
                coupons.stream().map(this::toCouponResponse).toList());
    }

    private void validatePayments(UUID customerId, List<CardPaymentRequestDto> payments, OrderQuoteResponseDto quote) {
        BigDecimal paidByCards = payments.stream().map(CardPaymentRequestDto::amount).map(this::money)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paidByCards.compareTo(quote.total()) != 0) {
            throw new BusinessRuleException(
                    "A soma dos valores dos cartões deve ser igual ao total restante da compra.");
        }
        if (payments.isEmpty() && quote.total().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessRuleException("Informe ao menos um cartão para pagar o valor restante da compra.");
        }
        if (payments.stream().map(CardPaymentRequestDto::cardId).distinct().count() != payments.size()) {
            throw new BusinessRuleException("Um mesmo cartão não pode ser informado mais de uma vez no pagamento.");
        }
        boolean usesCoupons = quote.couponDiscount().compareTo(BigDecimal.ZERO) > 0;
        for (CardPaymentRequestDto payment : payments) {
            findCard(payment.cardId(), customerId);
            if (payments.size() > 1 && payment.amount().compareTo(DEZ_REAIS) < 0) {
                throw new BusinessRuleException(
                        "Cada cartão deve pagar ao menos R$ 10,00 quando houver mais de um cartão.");
            }
            if (!usesCoupons && payment.amount().compareTo(DEZ_REAIS) < 0) {
                throw new BusinessRuleException(
                        "Valor inferior a R$ 10,00 no cartão só é permitido quando houver cupom na compra.");
            }
        }
    }

    private void validateCoupons(List<Coupon> coupons) {
        long promotional = coupons.stream().filter(coupon -> coupon.getType() == CouponTypeEnum.PROMOCIONAL).count();
        if (promotional > 1)
            throw new BusinessRuleException("Apenas um cupom promocional pode ser utilizado por compra.");
    }

    private void validateNoUnnecessaryCoupons(List<Coupon> coupons, BigDecimal grossTotal) {
        BigDecimal remaining = grossTotal;
        for (Coupon coupon : coupons) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException(
                        "Não é permitido usar cupom desnecessário após a compra já estar totalmente coberta.");
            }
            remaining = remaining.subtract(coupon.getValue());
        }
    }

    private Coupon generateExchangeCouponIfNeeded(List<Coupon> coupons, BigDecimal grossTotal, Customer customer) {
        BigDecimal selectedValue = coupons.stream().map(Coupon::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal difference = selectedValue.subtract(grossTotal);
        if (difference.compareTo(BigDecimal.ZERO) <= 0)
            return null;
        Coupon coupon = new Coupon("TROCA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                CouponTypeEnum.TROCA, money(difference), "Cupom de troca gerado pela diferença de cupons utilizados.",
                customer);
        return couponRepository.save(coupon);
    }

    private List<Coupon> resolveCoupons(List<UUID> couponIds, UUID customerId) {
        if (couponIds == null || couponIds.isEmpty())
            return List.of();
        LinkedHashSet<UUID> ids = new LinkedHashSet<>(couponIds);
        if (ids.size() != couponIds.size())
            throw new BusinessRuleException("Um cupom não pode ser informado mais de uma vez.");
        List<Coupon> coupons = couponRepository.findByIdInAndActiveTrue(ids);
        if (coupons.size() != ids.size() || coupons.stream()
                .anyMatch(coupon -> coupon.getCustomer() != null && !coupon.getCustomer().getId().equals(customerId)))
            throw new BusinessRuleException("Um ou mais cupons informados não estão disponíveis.");
        return coupons.stream().sorted(Comparator.comparing(Coupon::getValue).reversed()).toList();
    }

    private void validateAvailableQuantity(Product product, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(product.getId())
                .orElseThrow(() -> new BusinessRuleException("Estoque do produto não encontrado."));
        if (!product.isActive() || inventory.getAvailableQuantity() < quantity) {
            throw new BusinessRuleException(
                    "A quantidade solicitada para " + product.getName() + " não está disponível em estoque.");
        }
    }

    private void validateCartAvailability(ShoppingCart cart) {
        cart.getItems().forEach(item -> validateAvailableQuantity(item.getProduct(), item.getQuantity()));
    }

    private Customer findCustomer(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private Product findProduct(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado."));
    }

    private ShoppingCart findCartWithItems(UUID customerId) {
        return shoppingCartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new BusinessRuleException("O carrinho está vazio."));
    }

    private Address findDeliveryAddress(UUID customerId, UUID addressId) {
        Address address = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Endereço de entrega não encontrado."));
        if (!address.getPurposes().contains(PurposeEnum.ENTREGA))
            throw new BusinessRuleException("O endereço selecionado não possui finalidade de entrega.");
        return address;
    }

    private CreditCard findCard(UUID cardId, UUID customerId) {
        return creditCardRepository.findByIdAndCustomerId(cardId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão de crédito não encontrado."));
    }

    private String normalizedSize(String size) {
        return size.trim().toUpperCase();
    }

    private BigDecimal itemTotal(CartItem item) {
        return item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }

    private BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String nextOrderCode() {
        PurchaseOrder last = purchaseOrderRepository.findTopByOrderByCodeDesc();
        int next = last == null ? 1 : Integer.parseInt(last.getCode().substring(4)) + 1;
        return "PED-%06d".formatted(next);
    }

    private CartResponseDto toCartResponse(ShoppingCart cart) {
        if (cart == null)
            return new CartResponseDto(null, List.of(), BigDecimal.ZERO.setScale(2));
        List<CartItemResponseDto> items = cart.getItems().stream().map(this::toCartItemResponse).toList();
        BigDecimal subtotal = items.stream().map(CartItemResponseDto::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartResponseDto(cart.getId(), items, money(subtotal));
    }

    private CartItemResponseDto toCartItemResponse(CartItem item) {
        Product product = item.getProduct();
        int stock = inventoryRepository.findByProductId(product.getId()).map(Inventory::getAvailableQuantity).orElse(0);
        ProductResponseDto response = new ProductResponseDto(product.getId(), product.getCode(), product.getName(),
                product.getDescription(), product.getPrice(), product.getImageUrl(), stock);
        return new CartItemResponseDto(item.getId(), response, item.getSize(), item.getQuantity(), product.getPrice(),
                money(itemTotal(item)));
    }

    private CouponResponseDto toCouponResponse(Coupon coupon) {
        return new CouponResponseDto(coupon.getId(), coupon.getCode(), coupon.getType(), coupon.getValue(),
                coupon.getDescription());
    }

    private AddressResponseDto toAddressResponse(Address address) {
        return new AddressResponseDto(address.getId(), address.getIdentification(), address.getPurposes(),
                address.getResidenceType().getDescription(),
                address.getPublicPlaceType().getDescription(), address.getPublicPlace(), address.getAddressNumber(),
                address.getNeighborhood(),
                address.getCep(), address.getCity(), address.getState(), address.getCountry(), address.getComplement(),
                address.getObservation());
    }

    private OrderResponseDto toOrderResponse(PurchaseOrder order, Coupon generatedCoupon) {
        List<CartItemResponseDto> items = order.getItems().stream().map(item -> new CartItemResponseDto(item.getId(),
                new ProductResponseDto(item.getProduct().getId(), item.getProductCode(), item.getProductName(),
                        item.getProduct().getDescription(), item.getUnitPrice(), item.getProduct().getImageUrl(), 0),
                item.getSize(), item.getQuantity(), item.getUnitPrice(), item.getTotal())).toList();
        List<OrderPaymentResponseDto> payments = order.getPayments().stream()
                .map(payment -> new OrderPaymentResponseDto(payment.getCard().getId(),
                        payment.getCard().getCardFlag() + " final " + payment.getCard().getLast4(),
                        payment.getAmount()))
                .toList();
        List<CouponResponseDto> coupons = order.getCoupons().stream().map(OrderCoupon::getCoupon)
                .map(this::toCouponResponse).toList();
        return new OrderResponseDto(order.getId(), order.getCode(), order.getStatus(), order.getCreatedAt(),
                toAddressResponse(order.getDeliveryAddress()), items,
                payments, coupons, order.getSubtotal(), order.getShipping(), order.getCouponDiscount(),
                order.getTotal(), generatedCoupon == null ? null : toCouponResponse(generatedCoupon));
    }
}
