package com.jostore.dev.exception;

/** A correção do carrinho precisa ser confirmada mesmo quando o checkout é interrompido. */
public class CartAdjustedException extends BusinessRuleException {
    public CartAdjustedException() { super("O estoque foi alterado. As quantidades foram atualizadas e os itens indisponíveis removidos. Revise o carrinho antes de finalizar."); }
}
