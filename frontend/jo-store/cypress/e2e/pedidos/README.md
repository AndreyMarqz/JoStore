# Testes E2E — Gerenciamento de vendas eletrônicas

Os testes desta pasta usam um banco isolado (`jostore_e2e`) e uma API Spring no perfil `e2e`.

Em um terminal na pasta `backend/dev`, inicie o banco:

```powershell
docker compose --profile e2e up -d postgres-e2e
```

Em outro terminal, inicie a API no perfil E2E e na porta 8081:

```powershell
$env:SPRING_PROFILES_ACTIVE = "e2e"
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

Na pasta `frontend/jo-store`, execute os cenários. O Cypress iniciará um Vite isolado na porta `5174`, apontando para a API E2E:

```powershell
npm run cy:vendas
```

Para acompanhá-los visualmente, use `npm run cy:open`. O roteiro de demonstração usa pausas de 1,8 segundo entre interações para que o fluxo seja acompanhável.
