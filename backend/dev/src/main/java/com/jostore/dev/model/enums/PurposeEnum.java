package com.jostore.dev.model.enums;

public enum PurposeEnum {
    RESIDENCIA("Residência"),
    COBRANCA("Cobrança"),
    ENTREGA("Entrega");

    private final String descricao;

    PurposeEnum(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

}

