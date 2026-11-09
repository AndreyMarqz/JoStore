from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Projetos\JoStore - Projeto\JoStore")
TEMPLATE = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\Template_Plano_de_Testes.docx")
OUT = ROOT / "docs" / "PlanoTestes_GrupoAndrey.docx"

NAVY = "1F4E78"
LIGHT_BLUE = "D9EAF7"
PALE_BLUE = "EFF5FA"
GRID = "B7C9D6"
GRAY = "F2F2F2"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=GRID, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=90, start=100, bottom=90, end=100):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_run(run, size=9.2, bold=False, color="000000", italic=False):
    run.font.name = "Arial"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)


def write_paragraph(paragraph, text, *, size=9.8, bold=False, italic=False, color="000000", align=None, space_after=5, space_before=0):
    paragraph.clear()
    if text:
        run = paragraph.add_run(text)
        set_run(run, size=size, bold=bold, italic=italic, color=color)
    pf = paragraph.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    pf.line_spacing = 1.08
    if align is not None:
        paragraph.alignment = align
    return paragraph


def add_body(doc, text, *, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.1
    if bold_lead and text.startswith(bold_lead):
        r = p.add_run(bold_lead)
        set_run(r, 9.8, bold=True)
        r = p.add_run(text[len(bold_lead):])
        set_run(r, 9.8)
    else:
        r = p.add_run(text)
        set_run(r, 9.8)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading{level}")
    p.clear()
    r = p.add_run(text)
    set_run(r, 13 if level == 1 else 11, bold=True)
    p.paragraph_format.space_before = Pt(13 if level == 1 else 8)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    return p


def add_bullet(doc, text):
    # O template possui "List Paragraph", mas não uma definição própria de "List Bullet".
    p = doc.add_paragraph(style="List Paragraph")
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    set_run(r, 9.6)
    return p


def set_table_widths(table, widths):
    for row in table.rows:
        for i, width in enumerate(widths):
            row.cells[i].width = Cm(width)


def add_table(doc, headers, rows, widths, *, font_size=8.6):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    set_table_widths(table, widths)
    header = table.rows[0]
    set_repeat_table_header(header)
    for i, value in enumerate(headers):
        cell = header.cells[i]
        set_cell_shading(cell, NAVY)
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        write_paragraph(cell.paragraphs[0], value, size=8.5, bold=True, color="FFFFFF", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)
    for idx, values in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(values):
            cell = cells[i]
            set_cell_border(cell)
            set_cell_margins(cell)
            if idx % 2 == 1:
                set_cell_shading(cell, PALE_BLUE)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            alignment = WD_ALIGN_PARAGRAPH.CENTER if i in (0, len(values) - 1) and len(str(value)) < 35 else WD_ALIGN_PARAGRAPH.LEFT
            write_paragraph(cell.paragraphs[0], str(value), size=font_size, align=alignment, space_after=0)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    return table


def add_case(doc, case):
    add_heading(doc, f"{case['id']} - {case['title']}", 2)
    info = [
        ("Requisitos rastreados", case["requirements"]),
        ("Caso de uso relacionado", case["usecase"]),
        ("Nível / tipo", case["level"]),
        ("Técnica de projeto", case["technique"]),
        ("Prioridade", case["priority"]),
        ("Pré-condições", case["preconditions"]),
        ("Dados de teste", case["data"]),
    ]
    table = doc.add_table(rows=0, cols=2)
    table.autofit = False
    set_table_widths(table, [4.2, 15.0])
    for index, (label, value) in enumerate(info):
        cells = table.add_row().cells
        for cell in cells:
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cells[0], LIGHT_BLUE)
        write_paragraph(cells[0].paragraphs[0], label, size=8.5, bold=True, space_after=0)
        write_paragraph(cells[1].paragraphs[0], value, size=8.5, space_after=0)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    add_table(doc, ["Passo", "Ação", "Resultado esperado"], case["steps"], [1.3, 8.3, 9.6], font_size=8.3)
    closing = [("Pós-condições", case["post"]), ("Automatizado?", case["automated"]), ("Resultado da execução", "Planejado. A execução e as evidências não fazem parte desta entrega.")]
    table = doc.add_table(rows=0, cols=2)
    table.autofit = False
    set_table_widths(table, [4.2, 15.0])
    for label, value in closing:
        cells = table.add_row().cells
        for cell in cells:
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cells[0], LIGHT_BLUE)
        write_paragraph(cells[0].paragraphs[0], label, size=8.5, bold=True, space_after=0)
        write_paragraph(cells[1].paragraphs[0], value, size=8.5, space_after=0)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def clear_body(doc):
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def add_cover(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(105)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Plano de Testes")
    set_run(r, 24, bold=True)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run("JoStore")
    set_run(r, 17, bold=True)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Gestão de clientes e criação de pedidos")
    set_run(r, 12)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(110)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for line in ("Autor: Andrey Marques", "Versão 1.0", "15 de outubro de 2026"):
        r = p.add_run(line + "\n")
        set_run(r, 10.5)


CASES = [
    {
        "id": "CT001", "title": "Cadastrar cliente com dados válidos e código único",
        "requirements": "RF0021, RNF0035", "usecase": "UC - Gestão de clientes",
        "level": "Integração / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "API, banco de testes e domínios disponíveis; CPF e e-mail ainda não utilizados.",
        "data": "Nome completo, CPF de 11 dígitos, data de nascimento, telefone, e-mail e senha forte.",
        "steps": [("1", "Enviar cadastro válido.", "Cliente é criado."), ("2", "Consultar o cadastro criado.", "Código de cliente é retornado e é único."), ("3", "Verificar a resposta da API.", "Senha não é exposta na resposta.")],
        "post": "Cliente ativo persistido para os demais testes.", "automated": "Sim. Integração com JUnit 5, MockMvc e Testcontainers."
    },
    {
        "id": "CT002", "title": "Rejeitar senha fraca ou confirmação divergente",
        "requirements": "RF0021, RNF0031, RNF0032", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Tela de cadastro disponível.", "data": "Senha sem maiúscula, sem caractere especial ou confirmação diferente.",
        "steps": [("1", "Preencher os demais dados válidos.", "Formulário permanece apto a validar a senha."), ("2", "Informar senha inválida ou confirmação distinta.", "Mensagem de validação é exibida."), ("3", "Tentar concluir o cadastro.", "Cadastro não é criado.")],
        "post": "Nenhum cliente é persistido.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT003", "title": "Validar ausência de dados obrigatórios no cadastro",
        "requirements": "RF0021", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Tela de cadastro disponível.", "data": "Formulário sem nome, CPF, e-mail ou telefone.",
        "steps": [("1", "Deixar um dado obrigatório vazio.", "Campo é identificado para correção."), ("2", "Tentar concluir o cadastro.", "Sistema informa a inconsistência."), ("3", "Consultar a lista de clientes.", "Nenhum novo cadastro é localizado.")],
        "post": "Base não recebe registro incompleto.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT004", "title": "Alterar dados cadastrais do cliente",
        "requirements": "RF0022", "usecase": "UC - Gestão de clientes",
        "level": "Integração / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Cliente ativo previamente cadastrado.", "data": "Novo nome, telefone e e-mail válidos.",
        "steps": [("1", "Solicitar alteração dos dados cadastrais.", "Alteração é aceita."), ("2", "Consultar o cliente por identificador.", "Dados alterados são exibidos."), ("3", "Conferir dados não alterados.", "Campos não informados permanecem consistentes.")],
        "post": "Dados cadastrais atualizados.", "automated": "Sim. JUnit 5 / MockMvc e Cypress."
    },
    {
        "id": "CT005", "title": "Inativar cadastro de cliente",
        "requirements": "RF0023", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Cliente ativo consultável pelo administrador.", "data": "Cliente ativo de massa de testes.",
        "steps": [("1", "Selecionar o cliente na consulta administrativa.", "Dados do cliente são apresentados."), ("2", "Solicitar inativação.", "Status é atualizado."), ("3", "Consultar novamente por status.", "Cliente aparece como inativo.")],
        "post": "Cliente permanece cadastrado, porém inativo.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT006", "title": "Consultar clientes por filtros isolados e combinados",
        "requirements": "RF0024, RNF0011", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional e não funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Ao menos dois clientes com dados distintos estão cadastrados.", "data": "CPF, e-mail, nome parcial, código e status.",
        "steps": [("1", "Pesquisar por um filtro isolado.", "Resultado corresponde ao filtro."), ("2", "Combinar filtros compatíveis.", "Resultado satisfaz todos os filtros."), ("3", "Medir a consulta com massa prevista.", "Resposta ocorre em até 1 segundo.")],
        "post": "Nenhum dado é alterado.", "automated": "Sim. Cypress; medição de resposta na chamada de catálogo/consulta."
    },
    {
        "id": "CT007", "title": "Adicionar e alterar endereço sem editar dados pessoais",
        "requirements": "RF0026, RNF0034", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Cliente ativo com acesso ao perfil.", "data": "Endereço identificado por frase curta e dados de entrega válidos.",
        "steps": [("1", "Abrir a seção de endereços do perfil.", "Dados pessoais não precisam ser editados."), ("2", "Adicionar ou alterar endereço.", "Endereço é salvo."), ("3", "Consultar o perfil.", "Endereço atualizado é apresentado.")],
        "post": "Perfil possui o endereço atualizado.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT008", "title": "Gerenciar cartões e definir cartão preferencial",
        "requirements": "RF0027", "usecase": "UC - Gestão de clientes",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Alta",
        "preconditions": "Cliente ativo com perfil acessível.", "data": "Dois cartões válidos de bandeiras aceitas.",
        "steps": [("1", "Cadastrar dois cartões no perfil.", "Cartões ficam associados ao cliente."), ("2", "Definir um cartão como preferencial.", "Preferência é atualizada."), ("3", "Consultar cartões.", "Apenas um cartão está marcado como preferencial.")],
        "post": "Cartões vinculados e preferência persistida.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT009", "title": "Alterar somente a senha e preservar armazenamento protegido",
        "requirements": "RF0028, RNF0031, RNF0032, RNF0033", "usecase": "UC - Gestão de clientes",
        "level": "Integração / Funcional e não funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Cliente ativo e senha atual conhecida pela massa de teste.", "data": "Senha atual correta; nova senha forte e confirmação idêntica.",
        "steps": [("1", "Solicitar alteração apenas da senha.", "Dados cadastrais não são solicitados."), ("2", "Informar nova senha forte e confirmação igual.", "Senha é atualizada."), ("3", "Inspecionar persistência no ambiente de teste.", "Senha armazenada não corresponde ao texto puro.")],
        "post": "Somente a credencial é alterada.", "automated": "Sim. JUnit 5 / integração."
    },
    {
        "id": "CT010", "title": "Adicionar, editar, visualizar e remover mais de um item do carrinho",
        "requirements": "RF0031, RF0032, RN0031", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Cliente ativo; dois produtos disponíveis em estoque.", "data": "Camisa tamanho M, quantidade 2; camiseta tamanho M, quantidade 1.",
        "steps": [("1", "Adicionar dois produtos ao carrinho.", "Itens são incluídos."), ("2", "Alterar a quantidade de um item na visualização.", "Subtotal e quantidade são atualizados."), ("3", "Remover o segundo item.", "Item deixa de constar no carrinho.")],
        "post": "Carrinho contém apenas o item remanescente com quantidade atualizada.", "automated": "Sim. Cypress: gerenciar-itens-no-carrinho.cy.ts."
    },
    {
        "id": "CT011", "title": "Impedir adição de produto indisponível ao carrinho",
        "requirements": "RF0031, RN0031", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Produto da massa de dados com estoque igual a zero.", "data": "Produto indisponível; quantidade 1.",
        "steps": [("1", "Abrir produto sem estoque.", "Produto pode ser consultado."), ("2", "Tentar adicioná-lo ao carrinho.", "Operação é recusada."), ("3", "Consultar carrinho.", "Produto não foi incluído.")],
        "post": "Carrinho não é alterado.", "automated": "Sim. Cypress: gerenciar-itens-no-carrinho.cy.ts."
    },
    {
        "id": "CT012", "title": "Impedir quantidade superior ao estoque disponível",
        "requirements": "RF0032, RN0031", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Análise de valor limite", "priority": "Alta",
        "preconditions": "Produto com estoque conhecido de 10 unidades.", "data": "Quantidade 10 e quantidade 11.",
        "steps": [("1", "Adicionar a quantidade igual ao estoque.", "Sistema aceita a quantidade."), ("2", "Tentar adicionar quantidade 11.", "Sistema rejeita a inclusão."), ("3", "Consultar carrinho.", "Quantidade inválida não é persistida.")],
        "post": "Estoque disponível não é excedido no carrinho.", "automated": "Sim. Cypress: gerenciar-itens-no-carrinho.cy.ts."
    },
    {
        "id": "CT013", "title": "Iniciar compra e calcular frete para endereço em São Paulo",
        "requirements": "RF0033, RF0034, RNF0011", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional e não funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Carrinho com duas peças e endereço de entrega em SP.", "data": "Frete adotado no projeto: R$ 15,00 base + R$ 2,00 por peça.",
        "steps": [("1", "Prosseguir do carrinho ao checkout.", "Checkout é iniciado."), ("2", "Selecionar endereço em SP.", "Frete é recalculado."), ("3", "Conferir o total.", "Frete corresponde a R$ 19,00 para duas peças.")],
        "post": "Checkout permanece disponível com frete calculado.", "automated": "Sim. Cypress: iniciar-checkout-e-calcular-frete.cy.ts."
    },
    {
        "id": "CT014", "title": "Aplicar adicional de frete para endereço fora de São Paulo",
        "requirements": "RF0034", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Média",
        "preconditions": "Carrinho com itens e endereço de entrega fora de SP.", "data": "Mesmo carrinho do CT013; endereço em outra UF; adicional adotado de R$ 10,00.",
        "steps": [("1", "Selecionar endereço fora de SP.", "Sistema recalcula o frete."), ("2", "Comparar ao frete para SP.", "Adicional de R$ 10,00 é aplicado."), ("3", "Conferir total do pedido.", "Total reflete o novo frete.")],
        "post": "Cotação do checkout fica associada ao endereço selecionado.", "automated": "Sim. Cypress: iniciar-checkout-e-calcular-frete.cy.ts."
    },
    {
        "id": "CT015", "title": "Selecionar endereço de entrega previamente cadastrado",
        "requirements": "RF0035", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Cliente com ao menos dois endereços cadastrados e carrinho com item.", "data": "Endereço A e endereço B do perfil.",
        "steps": [("1", "Abrir checkout.", "Endereços do perfil são listados."), ("2", "Selecionar um endereço existente.", "Endereço passa a ser o destino da compra."), ("3", "Conferir o frete.", "Frete é recalculado conforme o endereço.")],
        "post": "Nenhum novo endereço é criado.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT016", "title": "Cadastrar endereço no checkout e incorporá-lo ao perfil",
        "requirements": "RF0035, RF0026, RNF0034", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Cliente com carrinho não vazio.", "data": "Endereço identificado como Trabalho, com logradouro, número, bairro, CEP, cidade, UF e país.",
        "steps": [("1", "Escolher adicionar endereço no checkout.", "Formulário é exibido."), ("2", "Preencher e salvar o endereço válido.", "Endereço é associado ao cliente."), ("3", "Consultar endereços do checkout/perfil.", "Novo endereço fica disponível para seleção.")],
        "post": "Endereço incorporado ao perfil e selecionado na compra.", "automated": "Sim. Cypress: selecionar-e-cadastrar-endereco.cy.ts."
    },
    {
        "id": "CT017", "title": "Selecionar cartão previamente cadastrado para pagamento",
        "requirements": "RF0036, RF0027", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Cliente com cartão preferencial e checkout com saldo a pagar.", "data": "Cartão preferencial válido.",
        "steps": [("1", "Abrir a etapa de pagamento.", "Cartões do perfil são apresentados."), ("2", "Selecionar o cartão cadastrado.", "Valor a pagar é associado ao cartão."), ("3", "Conferir resumo.", "Forma de pagamento selecionada é exibida.")],
        "post": "Checkout contém forma de pagamento válida.", "automated": "Sim. Cypress."
    },
    {
        "id": "CT018", "title": "Cadastrar cartão no checkout e incorporá-lo ao perfil",
        "requirements": "RF0036, RF0027", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Partição de equivalência", "priority": "Alta",
        "preconditions": "Cliente no checkout com saldo a pagar.", "data": "Titular, número, bandeira e código de segurança válidos.",
        "steps": [("1", "Escolher adicionar cartão.", "Formulário de cartão é aberto."), ("2", "Salvar cartão válido.", "Cartão é associado ao cliente."), ("3", "Selecioná-lo no pagamento.", "Cartão aparece na forma de pagamento.")],
        "post": "Novo cartão fica disponível no perfil.", "automated": "Sim. Cypress: cartoes-e-rateio.cy.ts."
    },
    {
        "id": "CT019", "title": "Exigir mínimo de R$ 10,00 por cartão em pagamento dividido",
        "requirements": "RF0036, RN0034", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Análise de valor limite", "priority": "Alta",
        "preconditions": "Dois cartões selecionados; total superior a R$ 20,00.", "data": "Rateio R$ 9,00 e restante do valor; depois R$ 10,00 e restante válido.",
        "steps": [("1", "Selecionar dois cartões.", "Campos de rateio são apresentados."), ("2", "Informar R$ 9,00 em um cartão.", "Sistema impede a finalização."), ("3", "Informar ao menos R$ 10,00 em cada cartão.", "Rateio é aceito.")],
        "post": "Pagamento inválido não cria pedido.", "automated": "Sim. Cypress: cartoes-e-rateio.cy.ts."
    },
    {
        "id": "CT020", "title": "Permitir somente um cupom promocional por compra",
        "requirements": "RF0036, RF0037, RN0033", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Alta",
        "preconditions": "Cliente com dois cupons promocionais válidos.", "data": "Cupom promocional A e cupom promocional B.",
        "steps": [("1", "Selecionar o primeiro cupom promocional.", "Cupom é aplicado."), ("2", "Abrir os demais cupons promocionais.", "Alternativas ficam indisponíveis."), ("3", "Conferir resumo do pagamento.", "Somente um cupom promocional é considerado.")],
        "post": "Regra de um cupom promocional é preservada.", "automated": "Sim. Cypress: cupons-e-pagamentos.cy.ts."
    },
    {
        "id": "CT021", "title": "Permitir saldo de cartão abaixo de R$ 10,00 com cupom",
        "requirements": "RF0037, RN0035", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Alta",
        "preconditions": "Checkout com cupom válido e um cartão disponível.", "data": "Cupom que deixa saldo de R$ 6,90 no cartão.",
        "steps": [("1", "Aplicar cupom válido.", "Total é reduzido."), ("2", "Selecionar cartão para o saldo residual.", "Saldo menor que R$ 10,00 é aceito nesse contexto."), ("3", "Finalizar compra.", "Sistema aceita a composição.")],
        "post": "Pedido pode ser criado com a exceção prevista pela regra.", "automated": "Sim. Cypress: cupons-e-pagamentos.cy.ts."
    },
    {
        "id": "CT022", "title": "Gerar cupom de troca para crédito excedente",
        "requirements": "RF0037, RN0036", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Alta",
        "preconditions": "Cliente com cupons de troca válidos que superem o total sem excesso desnecessário.", "data": "Cupons de R$ 80,00 e R$ 50,00 para compra inferior a R$ 130,00.",
        "steps": [("1", "Selecionar os cupons necessários.", "Saldo dos cupons é calculado."), ("2", "Finalizar a compra.", "Pedido é aceito."), ("3", "Consultar cupons do cliente.", "Cupom de troca correspondente à diferença é disponibilizado.")],
        "post": "Diferença de crédito fica registrada em cupom de troca.", "automated": "Sim. Cypress: cupons-e-pagamentos.cy.ts."
    },
    {
        "id": "CT023", "title": "Recusar cupom desnecessário após o total estar coberto",
        "requirements": "RF0037, RN0036", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Tabela de decisão", "priority": "Alta",
        "preconditions": "Cliente com três cupons válidos; dois já cobrem a compra.", "data": "Cupons de R$ 80,00, R$ 50,00 e R$ 40,00.",
        "steps": [("1", "Selecionar dois cupons que cobrem o total.", "Total fica quitado ou excedido de forma necessária."), ("2", "Tentar incluir terceiro cupom.", "Sistema rejeita a combinação."), ("3", "Conferir pagamento.", "Cupom desnecessário não é aplicado.")],
        "post": "Compra não usa crédito excedente desnecessário.", "automated": "Sim. Cypress: cupons-e-pagamentos.cy.ts."
    },
    {
        "id": "CT024", "title": "Finalizar compra com status EM PROCESSAMENTO",
        "requirements": "RF0038", "usecase": "UC - Criação de pedido",
        "level": "Sistema (E2E) / Funcional", "technique": "Transição de estado", "priority": "Alta",
        "preconditions": "Carrinho com item, endereço de entrega e forma de pagamento válidos.", "data": "Compra válida com cartão previamente cadastrado.",
        "steps": [("1", "Concluir as etapas de checkout.", "Resumo fica consistente."), ("2", "Acionar finalizar compra.", "Pedido é registrado."), ("3", "Consultar o pedido criado.", "Status é EM PROCESSAMENTO.")],
        "post": "Pedido registrado; carrinho é limpo.", "automated": "Sim. Cypress: finalizar-pedido.cy.ts."
    },
    {
        "id": "CT025", "title": "Registrar log ao finalizar pedido",
        "requirements": "RF0038, RNF0012", "usecase": "UC - Criação de pedido",
        "level": "Integração / Não funcional", "technique": "Teste baseado em cenário", "priority": "Alta",
        "preconditions": "Compra válida pronta para finalização; base de testes consultável.", "data": "Cliente responsável, pedido e composição de pagamento válidos.",
        "steps": [("1", "Finalizar a compra.", "Operação de escrita é concluída."), ("2", "Consultar o registro de log.", "Log possui data, hora, responsável e dados da operação."), ("3", "Relacionar log ao pedido.", "Entidade e operação correspondem ao pedido criado.")],
        "post": "Log de transação fica persistido.", "automated": "Sim. Cypress com consulta à massa E2E ou integração."
    },
    {
        "id": "CT026", "title": "Registrar log nas operações de escrita do carrinho",
        "requirements": "RF0031, RNF0012", "usecase": "UC - Criação de pedido",
        "level": "Integração / Não funcional", "technique": "Teste baseado em cenário", "priority": "Média",
        "preconditions": "Cliente e produto disponíveis; base de testes consultável.", "data": "Inclusão, alteração e exclusão de item de carrinho.",
        "steps": [("1", "Adicionar item ao carrinho.", "Operação é registrada."), ("2", "Alterar e remover o item.", "Cada escrita gera registro correspondente."), ("3", "Consultar logs.", "Data, hora, responsável e dados alterados são mantidos.")],
        "post": "Trilha de auditoria das escritas do carrinho disponível.", "automated": "Sim. Integração planejada com JUnit 5 / Testcontainers."
    },
]


def build_document():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document(TEMPLATE)
    clear_body(doc)
    for name in ("Heading1", "Heading2"):
        style = doc.styles[name]
        style.font.name = "Arial"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        style.font.color.rgb = RGBColor(0, 0, 0)
    doc.core_properties.title = "Plano de Testes JoStore"
    doc.core_properties.author = "Andrey Marques"
    doc.core_properties.subject = "Plano de testes da gestão de clientes e criação de pedidos"

    # Recria as duas seções A4 do template: capa e corpo do documento.
    first_section = doc.sections[0]
    first_section.page_width = Cm(21.0)
    first_section.page_height = Cm(29.7)
    first_section.left_margin = Cm(1.0)
    first_section.right_margin = Cm(1.0)
    first_section.top_margin = Cm(1.5)
    first_section.bottom_margin = Cm(3.1)
    first_section.different_first_page_header_footer = True

    add_cover(doc)
    body_section = doc.add_section(WD_SECTION_START.NEW_PAGE)
    body_section.page_width = Cm(21.0)
    body_section.page_height = Cm(29.7)
    body_section.left_margin = Cm(1.0)
    body_section.right_margin = Cm(1.0)
    body_section.top_margin = Cm(1.3)
    body_section.bottom_margin = Cm(1.6)
    body_section.different_first_page_header_footer = False
    add_heading(doc, "Histórico de versões", 1)
    add_table(doc, ["Data", "Versão", "Descrição", "Autor", "Revisor"], [
        ("15/10/2026", "1.0", "Versão inicial do plano de testes para gestão de clientes e criação de pedidos.", "Andrey Marques", "Revisão pelo professor"),
    ], [2.0, 1.5, 8.0, 4.0, 3.7])

    add_heading(doc, "Página de assinaturas", 1)
    add_table(doc, ["Campo", "Preenchimento"], [
        ("Revisado e aprovado por", "Professor responsável"),
        ("Data", ""),
        ("Revisado e aprovado por", ""),
        ("Data", ""),
    ], [6.2, 13.0])

    add_heading(doc, "Índice", 1)
    for entry in [
        "1. Introdução", "2. Itens a serem testados", "3. Itens fora do escopo", "4. Estratégia de testes",
        "5. Ambiente de testes", "6. Critérios", "7. Casos de teste", "8. Matriz de rastreabilidade",
        "9. Cronograma e responsabilidades", "10. Riscos e contingências", "11. Gestão de defeitos", "12. Entregáveis",
    ]:
        add_bullet(doc, entry)

    add_heading(doc, "1. Introdução", 1)
    add_heading(doc, "1.1 Objetivo", 2)
    add_body(doc, "Este Plano de Testes define como serão verificados os incrementos implementados da JoStore referentes à gestão de clientes e à criação de pedidos. O documento organiza o escopo, os níveis e técnicas de teste, a massa de dados, os casos rastreáveis ao DRS_LES_2_2026, as responsabilidades e os critérios objetivos para decidir se a entrega está apta à apresentação acadêmica.")
    add_heading(doc, "1.2 Escopo", 2)
    add_body(doc, "O ciclo cobre o cadastro, alteração, consulta, inativação, endereços, cartões e alteração de senha de clientes; o carrinho de compra; o início do checkout; o cálculo de frete; a seleção ou inclusão de endereço e cartão; o uso de cupons; e a finalização da compra em EM PROCESSAMENTO. A cobertura está limitada aos requisitos do DRS listados na seção 2 e ao comportamento implementado neste incremento.")
    add_heading(doc, "1.3 Documentos de referência", 2)
    add_table(doc, ["Documento", "Versão", "Observação"], [
        ("DRS_LES_2_2026", "Versão fornecida pela disciplina", "Fonte exclusiva dos requisitos funcionais, regras de negócio e requisitos não funcionais rastreados."),
        ("Código-fonte JoStore", "Estado atual do repositório", "Fonte para identificar funcionalidades implementadas, ferramentas e automações candidatas."),
        ("Template Plano de Testes", "Versão fornecida pela disciplina", "Estrutura adotada neste documento."),
    ], [5.3, 4.3, 9.6])
    add_heading(doc, "1.4 Definições e siglas", 2)
    add_table(doc, ["Termo", "Definição"], [
        ("DRS", "Documento de Requisitos de Software."), ("RF / RN / RNF", "Requisito Funcional / Regra de Negócio / Requisito Não Funcional."),
        ("CT", "Caso de teste."), ("E2E", "Teste ponta a ponta executado pela interface do usuário."),
        ("API", "Interface de programação utilizada entre front-end e back-end."), ("PERT", "Técnica de estimativa E = (O + 4M + P) / 6."),
    ], [4.0, 15.2])

    add_heading(doc, "2. Itens a serem testados", 1)
    add_body(doc, "Os itens abaixo delimitam o escopo rastreável deste plano. Os identificadores foram preservados conforme o DRS; os nomes de produtos foram adaptados ao contexto de vestuário da JoStore sem alterar o requisito de origem.")
    add_table(doc, ["Funcionalidade", "Requisitos do DRS", "Caso de uso", "Prioridade"], [
        ("Cadastro e manutenção de clientes", "RF0021, RF0022, RF0023, RF0024, RF0026, RF0027, RF0028; RNF0031 a RNF0035", "Gestão de clientes", "Alta"),
        ("Carrinho de compra", "RF0031, RF0032, RN0031; RNF0012", "Criação de pedido", "Alta"),
        ("Checkout e cálculo de frete", "RF0033, RF0034, RF0035; RNF0011", "Criação de pedido", "Alta"),
        ("Pagamento com cartões e cupons", "RF0036, RF0037; RN0033, RN0034, RN0035, RN0036", "Criação de pedido", "Alta"),
        ("Finalização e auditoria do pedido", "RF0038; RNF0012", "Criação de pedido", "Alta"),
    ], [4.7, 7.4, 4.5, 2.6])

    add_heading(doc, "3. Itens fora do escopo", 1)
    add_table(doc, ["Item", "Motivo da exclusão"], [
        ("Consulta de transações do cliente (RF0025)", "Não integra a funcionalidade priorizada neste incremento."),
        ("Validação posterior do pagamento e estados APROVADA/REPROVADA (RN0037, RN0038)", "Explicitamente fora da fase de criação de pedido; o pedido termina em EM PROCESSAMENTO."),
        ("Despacho, entrega e transições posteriores (RF0039, RF0040, RN0039, RN0040)", "Não implementados no incremento coberto."),
        ("Trocas, autorizações e cupons após recebimento (RF0041 a RF0045, RN0041 a RN0046)", "Fora da fase de criação de pedido."),
        ("Baixa, entrada e reentrada de estoque (RF0051 a RF0054 e regras correlatas)", "Apenas a disponibilidade para adição ao carrinho é coberta por RN0031."),
        ("Bloqueio, expiração e retirada temporária de itens (RN0032, RN0044, RN0045, RNF0042)", "Explicitamente fora deste incremento."),
        ("Análise de vendas, recomendações e requisitos de gráficos", "Não pertencem às funcionalidades implementadas e priorizadas neste ciclo."),
    ], [7.0, 12.2])

    add_heading(doc, "4. Estratégia de testes", 1)
    add_heading(doc, "4.1 Níveis de teste", 2)
    add_table(doc, ["Nível", "Objetivo", "Ferramenta", "Responsável"], [
        ("Unitário", "Verificar regras isoladas de cliente, senha, composição de pagamento e cálculo.", "JUnit 5 e Mockito", "Andrey Marques"),
        ("Integração", "Verificar controllers, serviços, persistência, validação e logs.", "JUnit 5, Spring Boot Test, MockMvc e Testcontainers PostgreSQL", "Andrey Marques"),
        ("Sistema (E2E)", "Verificar fluxos completos pela interface, da navegação ao registro de pedido.", "Cypress 16", "Andrey Marques"),
        ("Aceitação", "Demonstrar casos prioritários e validar a aderência ao DRS com o professor.", "Execução guiada e evidências do Cypress", "Andrey Marques e professor"),
    ], [2.7, 7.4, 5.2, 3.9])
    add_heading(doc, "4.2 Tipos de teste", 2)
    add_body(doc, "Funcional: verifica os RF e RN do escopo por meio dos CT001 a CT024. Regressão: reexecuta os casos automatizados após alterações no front-end, back-end ou banco de dados. Não funcional: verifica o tempo de resposta das consultas cobertas por RNF0011 e a geração de registros de escrita prevista por RNF0012; também cobre força, confirmação, criptografia e código de cliente previstos pelos RNF0031 a RNF0035.")
    add_heading(doc, "4.3 Técnicas de projeto de casos de teste", 2)
    add_table(doc, ["Técnica", "Onde foi aplicada"], [
        ("Partição de equivalência", "Cadastro de cliente válido/inválido, senha forte/fraca, filtros de consulta, endereço e cartão válidos."),
        ("Análise de valor limite", "Quantidade disponível versus quantidade superior ao estoque (CT012); mínimo de R$ 10,00 por cartão (CT019); resposta de consulta em até 1 segundo (CT006 e CT013)."),
        ("Tabela de decisão", "Combinações de cupom promocional, cupom de troca e cartão; condições de rateio e geração de cupom de troca (CT020 a CT023)."),
        ("Transição de estado", "Registro de pedido em EM PROCESSAMENTO após finalização (CT024)."),
        ("Teste baseado em cenário", "Fluxos completos de carrinho, checkout, endereço, cartão, finalização e auditoria."),
    ], [4.4, 14.8])

    add_heading(doc, "5. Ambiente de testes", 1)
    add_table(doc, ["Item", "Configuração"], [
        ("Sistema operacional", "Windows 11 para desenvolvimento e execução local."),
        ("Navegador", "Electron headless do Cypress; execução visual opcional pelo Cypress Open."),
        ("Front-end", "React com Vite, ambiente E2E em http://localhost:5174."),
        ("Back-end", "Java com Spring Boot, perfil e2e em http://localhost:8081/api/v1."),
        ("Banco de dados", "PostgreSQL em contêiner Docker, base isolada jostore_e2e na porta 5433."),
        ("Ferramentas", "Cypress 16, JUnit 5, Mockito, Spring Boot Test, MockMvc, Testcontainers, Docker Compose e Git."),
        ("Massa de dados", "Clientes, cartões, endereços, produtos, estoques e cupons E2E criados ou reinicializados antes dos cenários."),
    ], [4.5, 14.7])

    add_heading(doc, "6. Critérios", 1)
    add_table(doc, ["Critério", "Definição"], [
        ("Entrada", "Build disponível; ambiente E2E ativo; banco de testes acessível; massa de dados preparada; casos revisados."),
        ("Saída", "100% dos CTs de prioridade Alta aprovados; nenhum defeito Crítico ou Alto aberto; todos os requisitos do escopo associados a pelo menos um caso."),
        ("Suspensão", "Indisponibilidade do banco, da API ou do front-end que impeça a execução de mais de 50% dos casos; ou defeito crítico bloqueante."),
        ("Retomada", "Ambiente restaurado e defeito bloqueante corrigido; reteste do CT afetado e regressão dos casos relacionados."),
    ], [4.5, 14.7])

    add_heading(doc, "7. Casos de teste", 1)
    add_heading(doc, "7.1 Resumo dos casos de teste", 2)
    summary_rows = [(c["id"], c["title"], c["requirements"], c["priority"], "Sim" if c["automated"].startswith("Sim") else "Não") for c in CASES]
    add_table(doc, ["ID", "Título", "Requisitos", "Prioridade", "Automatizado"], summary_rows, [1.4, 6.8, 6.5, 2.0, 2.5], font_size=7.8)
    add_heading(doc, "7.2 Especificação dos casos de teste", 2)
    add_body(doc, "Os casos são planejados para repetição em ambiente isolado. A expressão “planejado” no campo de resultado indica que a execução completa e a coleta de evidências não são entregáveis obrigatórios deste plano.")
    for case in CASES:
        add_case(doc, case)

    add_heading(doc, "8. Matriz de rastreabilidade", 1)
    trace_rows = [
        ("RF0021", "Cadastrar cliente", "CT001, CT002, CT003", "Coberto"), ("RF0022", "Alterar cliente", "CT004", "Coberto"),
        ("RF0023", "Inativar cadastro de cliente", "CT005", "Coberto"), ("RF0024", "Consulta de clientes", "CT006", "Coberto"),
        ("RF0026", "Cadastro de endereços de entrega", "CT007, CT016", "Coberto"), ("RF0027", "Cadastro de cartões de crédito", "CT008, CT017, CT018", "Coberto"),
        ("RF0028", "Alteração apenas de senha", "CT009", "Coberto"), ("RF0031", "Gerenciar carrinho de compra", "CT010, CT011, CT026", "Coberto"),
        ("RF0032", "Definir quantidade de itens no carrinho", "CT010, CT012", "Coberto"), ("RF0033", "Realizar compra", "CT013", "Coberto"),
        ("RF0034", "Calcular frete", "CT013, CT014", "Coberto"), ("RF0035", "Selecionar endereço de entrega", "CT015, CT016", "Coberto"),
        ("RF0036", "Selecionar forma de pagamento", "CT017, CT018, CT019, CT020, CT021", "Coberto"), ("RF0037", "Uso de cupom para pagamento", "CT020, CT021, CT022, CT023", "Coberto"),
        ("RF0038", "Finalizar compra", "CT024, CT025", "Coberto"), ("RN0031", "Validar estoque na adição ao carrinho", "CT010, CT011, CT012", "Coberto"),
        ("RN0033", "Um cupom promocional por compra", "CT020", "Coberto"), ("RN0034", "Mínimo por cartão em pagamento dividido", "CT019", "Coberto"),
        ("RN0035", "Cupons com cartão de valor residual", "CT021", "Coberto"), ("RN0036", "Gerar cupom de troca por excedente", "CT022, CT023", "Coberto"),
        ("RNF0011", "Tempo de resposta para consultas", "CT006, CT013", "Coberto"), ("RNF0012", "Log de transação", "CT025, CT026", "Coberto"),
        ("RNF0031", "Senha forte", "CT002, CT009", "Coberto"), ("RNF0032", "Confirmação de senha", "CT002, CT009", "Coberto"),
        ("RNF0033", "Senha criptografada", "CT009", "Coberto"), ("RNF0034", "Alteração apenas de endereços", "CT007, CT016", "Coberto"),
        ("RNF0035", "Código de cliente único", "CT001", "Coberto"),
    ]
    add_table(doc, ["Requisito", "Descrição resumida", "Casos de teste", "Situação"], trace_rows, [2.4, 7.2, 6.6, 3.0], font_size=7.8)

    add_heading(doc, "9. Cronograma e responsabilidades", 1)
    add_body(doc, "As estimativas adotam PERT: E = (O + 4M + P) / 6, em horas. O total planejado é de aproximadamente 37,8 horas, distribuídas entre 12 e 17 de outubro de 2026.")
    add_table(doc, ["Atividade", "Responsável", "O", "M", "P", "E (h)", "Prazo"], [
        ("Projeto e revisão dos casos", "Andrey Marques", "4", "6", "8", "6,0", "12/10"),
        ("Preparação do ambiente e massa", "Andrey Marques", "2", "3", "5", "3,2", "13/10"),
        ("Testes unitários e de integração", "Andrey Marques", "5", "7", "10", "7,2", "14/10"),
        ("Automação E2E", "Andrey Marques", "6", "8", "12", "8,3", "15/10"),
        ("Execução, evidências e registro", "Andrey Marques", "3", "5", "7", "5,0", "16/10"),
        ("Reteste e regressão", "Andrey Marques", "3", "5", "8", "5,2", "17/10"),
        ("Consolidação do plano", "Andrey Marques", "2", "3", "5", "3,2", "17/10"),
    ], [5.5, 3.0, 1.1, 1.1, 1.1, 1.5, 2.0])

    add_heading(doc, "10. Riscos e contingências", 1)
    add_table(doc, ["Risco", "Probabilidade", "Impacto", "Ação de contingência"], [
        ("O DRS não define fórmula de cálculo de frete (RF0034).", "Alta", "Alto", "Usar o critério adotado no projeto somente como massa de teste e registrar a lacuna para validação do professor."),
        ("O DRS usa a terminologia livros, enquanto a JoStore comercializa vestuário.", "Alta", "Médio", "Manter os identificadores do DRS e adaptar apenas os exemplos de produto; solicitar confirmação do professor sobre a equivalência."),
        ("O DRS não detalha a composição completa dos dados obrigatórios de cliente.", "Média", "Médio", "Rastrear o fluxo ao RF0021 e registrar que validações adicionais da implementação não substituem requisito ausente."),
        ("Indisponibilidade de Docker, PostgreSQL, API ou Vite no ambiente E2E.", "Média", "Alto", "Usar banco isolado, verificar serviços antes da execução e restaurar a massa por scripts de fixture."),
        ("Validação por operadora e estados posteriores não estão no incremento.", "Alta", "Médio", "Manter RN0037, RN0038 e RF0039 a RF0045 fora do escopo; aceitar apenas EM PROCESSAMENTO."),
        ("Identificador RNF0044 aparece no DRS com descrições distintas em grupos diferentes.", "Média", "Médio", "Registrar a inconsistência ao professor; não incluí-lo neste escopo por pertencer a funcionalidades fora do incremento."),
    ], [7.2, 2.5, 2.0, 6.6], font_size=8.2)

    add_heading(doc, "11. Gestão de defeitos", 1)
    add_heading(doc, "11.1 Classificação de severidade", 2)
    add_table(doc, ["Severidade", "Critério"], [
        ("Crítica", "Impede o uso de uma funcionalidade essencial sem alternativa de contorno."),
        ("Alta", "Produz resultado incorreto em requisito de alta prioridade, mesmo que exista alternativa temporária."),
        ("Média", "Afeta regra secundária, mensagem, comportamento de recuperação ou cenário não principal."),
        ("Baixa", "Problema cosmético ou de apresentação sem impacto no resultado funcional."),
    ], [4.2, 15.0])
    add_heading(doc, "11.2 Registro de defeitos", 2)
    add_body(doc, "Os defeitos identificados durante a execução serão registrados no repositório do grupo, em issue identificada com o rótulo “defeito”, contendo CT relacionado, ambiente, passos para reprodução, resultado esperado, resultado observado, evidência, severidade e situação.")
    add_table(doc, ["ID", "Caso de teste", "Descrição", "Severidade", "Situação"], [
        ("-", "-", "Nenhum defeito é registrado durante a elaboração deste plano; a execução não integra esta entrega.", "-", "Planejado"),
    ], [1.4, 3.5, 9.0, 2.5, 2.8])

    add_heading(doc, "12. Entregáveis", 1)
    for item in [
        "Plano de Testes preenchido e rastreável ao DRS_LES_2_2026.",
        "Especificações dos CT001 a CT026 e matriz de rastreabilidade.",
        "Scripts automatizados planejados em JUnit 5 e Cypress, versionados no repositório do grupo.",
        "Evidências e relatório de execução, produzidos na etapa de execução posterior ao plano.",
    ]:
        add_bullet(doc, item)

    # Garantir atualização de campos, caso o documento seja aberto no Word.
    settings = doc.settings.element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")
    doc.save(OUT)


if __name__ == "__main__":
    build_document()
    print(OUT)
