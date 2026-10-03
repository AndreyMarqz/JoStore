from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.text.paragraph import Paragraph


TEMPLATE = Path(r"C:\Projetos\JoStore - Projeto\JoStore\.tmp-uc-vendas-template.docx")
OUTPUT = Path(r"C:\Projetos\JoStore - Projeto\JoStore\docs\UC_Gestao_de_Vendas_JoStore.docx")


def text_of_paragraph(paragraph):
    return paragraph.text.replace("\r", "").replace("\n", "").strip()


def clear_paragraph(paragraph):
    p = paragraph._element
    for child in list(p):
        if child.tag != qn("w:pPr"):
            p.remove(child)


def replace_paragraph_text(paragraph, text):
    clear_paragraph(paragraph)
    paragraph.add_run(text)


def set_cell(cell, text, bold=False):
    cell.text = ""
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(text)
    run.bold = bold
    paragraph.paragraph_format.space_after = Pt(0)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=100, bottom=100, end=100):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def style_table(table, widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for idx, cell in enumerate(table.rows[0].cells):
        shade(cell, "D9EAF7")
        set_cell_margins(cell)
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for row in table.rows[1:]:
        for cell in row.cells:
            set_cell_margins(cell)
    if widths:
        for row in table.rows:
            for idx, width in enumerate(widths):
                row.cells[idx].width = width


def add_heading(doc, number, title, level=1):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    if number == "14":
        paragraph.paragraph_format.page_break_before = True
    paragraph.paragraph_format.space_before = Pt(14 if level == 1 else 8)
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run(f"{number}. {title.upper()}")
    run.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return paragraph


def add_subheading(doc, code, title):
    paragraph = doc.add_paragraph(style="Heading 2")
    paragraph.paragraph_format.space_before = Pt(8)
    paragraph.paragraph_format.space_after = Pt(4)
    run = paragraph.add_run(f"{code}. {title}")
    run.bold = True
    run.font.color.rgb = RGBColor(0, 0, 0)
    return paragraph


def add_body(doc, text, indent=0):
    paragraph = doc.add_paragraph(style="Normal")
    paragraph.paragraph_format.space_after = Pt(5)
    paragraph.paragraph_format.left_indent = Cm(indent)
    paragraph.paragraph_format.line_spacing = 1.08
    paragraph.add_run(text)
    return paragraph


def add_list(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="Normal")
        paragraph.paragraph_format.space_after = Pt(2)
        paragraph.paragraph_format.left_indent = Cm(0.55)
        paragraph.paragraph_format.first_line_indent = Cm(-0.35)
        paragraph.add_run("• ").bold = True
        paragraph.add_run(item)


def add_flow_step(doc, code, text):
    paragraph = doc.add_paragraph(style="Normal")
    paragraph.paragraph_format.left_indent = Cm(0.35)
    paragraph.paragraph_format.first_line_indent = Cm(-0.35)
    paragraph.paragraph_format.space_after = Pt(4)
    label = paragraph.add_run(f"{code}. ")
    label.bold = True
    paragraph.add_run(text)
    return paragraph


def add_placeholder(doc, title, steps, elements):
    heading = add_subheading(doc, title.split(" ", 1)[0], title.split(" ", 1)[1])
    if title.startswith("11.7"):
        heading.paragraph_format.page_break_before = True
    note = doc.add_paragraph()
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    note.add_run(f"Área reservada para inserir a imagem do frontend — passos {steps}.").italic = True

    placeholder = doc.add_table(rows=1, cols=1)
    placeholder.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = placeholder.cell(0, 0)
    set_cell(cell, "COLE AQUI A IMAGEM DO FRONTEND CORRESPONDENTE", bold=True)
    cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    shade(cell, "F2F2F2")
    set_cell_margins(cell, 240, 160, 240, 160)
    placeholder.rows[0].height = Cm(5.4)
    placeholder.rows[0].height_rule = 1

    doc.add_paragraph()
    table = doc.add_table(rows=1, cols=5)
    headers = ["Elemento", "Tipo", "Status", "Tam.", "Comportamento"]
    for idx, value in enumerate(headers):
        set_cell(table.rows[0].cells[idx], value, bold=True)
    for row in elements:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            set_cell(cells[idx], value)
    style_table(table, [Cm(3.2), Cm(2.0), Cm(2.0), Cm(1.3), Cm(8.2)])
    doc.add_paragraph()


def remove_body_after(document, heading_text):
    body = document._body._element
    start = None
    for child in list(body):
        if child.tag == qn("w:p"):
            texts = [node.text or "" for node in child.iter(qn("w:t"))]
            if "".join(texts).strip() == heading_text:
                start = child
                break
    if start is None:
        raise RuntimeError(f"Não foi encontrado o início do corpo: {heading_text}")
    delete = False
    for child in list(body):
        if child is start:
            delete = True
        if delete and child.tag != qn("w:sectPr"):
            body.remove(child)


def update_cover(document):
    for paragraph in document.paragraphs:
        text = text_of_paragraph(paragraph)
        if text == "[NOME PROJETO]":
            replace_paragraph_text(paragraph, "JoStore")
        elif text == "[OPCIONAL]":
            replace_paragraph_text(paragraph, "Gestão de Vendas")
        elif text == "11.1.\tProtótipo da Tela de Busca":
            replace_paragraph_text(paragraph, "11.1. Protótipos do fluxo de compra")
        elif text == "11.2.\tProtótipo da Tela de Resultado da Busca":
            replace_paragraph_text(paragraph, "11.2. Protótipos do fluxo de entrega e troca")
        elif text == "12.1.\tEscola Cadastrada":
            replace_paragraph_text(paragraph, "12.1. Estados pós-execução")

    # Version-history tables, then cover metadata table.
    for table_index in (0, 3):
        table = document.tables[table_index]
        values = ["28/09/26", "1.0", "Especificação inicial do caso de uso Gestão de Vendas", "Andrey Marques", ""]
        for idx, value in enumerate(values):
            set_cell(table.rows[1].cells[idx], value)
    info = document.tables[1]
    set_cell(info.cell(0, 1), "JoStore – Acadêmico")
    set_cell(info.cell(1, 1), "Especificação de Caso de Uso: Gestão de Vendas")
    set_cell(info.cell(2, 1), "28 de setembro de 2026")
    set_cell(info.cell(3, 1), "Andrey Marques\nandreymmarques6@gmail.com")

    for section in document.sections:
        for header in (section.header, section.first_page_header, section.even_page_header):
            paragraphs = list(header.paragraphs)
            for table in header.tables:
                for row in table.rows:
                    for cell in row.cells:
                        paragraphs.extend(cell.paragraphs)
            for paragraph in paragraphs:
                text = text_of_paragraph(paragraph)
                if "Documento de Visão" in text and "[Nome do Projeto]" in text:
                    replace_paragraph_text(paragraph, "Especificação de Caso de Uso\nJoStore")
                elif "Documento de Visão" in text:
                    replace_paragraph_text(paragraph, "Especificação de Caso de Uso")
                elif "[Nome do Projeto]" in text:
                    replace_paragraph_text(paragraph, "JoStore")


def build_body(doc):
    add_heading(doc, "1", "Nome do Caso de Uso")
    add_body(doc, "CDU01 – Gestão de Vendas")

    add_heading(doc, "2", "Objetivo")
    add_body(doc, "Permitir que o cliente gerencie itens no carrinho, realize e acompanhe compras, e solicite trocas, enquanto o administrador despacha pedidos, confirma entregas e conduz o processo de troca, mantendo os estados da venda e os efeitos previstos sobre estoque e cupons.")

    add_heading(doc, "3", "Descrição")
    add_body(doc, "A Gestão de Vendas concentra o fluxo de compra da JoStore desde a inclusão de produtos em um carrinho temporário até a entrega. O cliente consulta o carrinho, ajusta quantidades, seleciona endereço de entrega, calcula frete, escolhe formas de pagamento e finaliza a compra.")
    add_body(doc, "Após a finalização, o sistema valida estoque e pagamento, registra o resultado no estado da compra e disponibiliza as ações administrativas de despacho e confirmação de entrega. Para compras entregues, o cliente pode solicitar troca; o administrador autoriza a solicitação, confirma o recebimento e informa a reentrada de itens em estoque quando aplicável.")

    add_heading(doc, "4", "Requisitos Funcionais")
    add_list(doc, [
        "RF0031 – Gerenciar carrinho de compra; RF0032 – Definir quantidade de itens no carrinho; RF0033 – Realizar compra.",
        "RF0034 – Calcular frete; RF0035 – Selecionar endereço de entrega; RF0036 – Selecionar forma de pagamento; RF0037 – Uso de cupom para pagamento; RF0038 – Finalizar compra.",
        "RF0039 – Despachar produtos para entrega; RF0040 – Produtos entregues.",
        "RF0041 – Solicitar troca; RF0042 – Autorizar trocas; RF0043 – Visualização de trocas; RF0044 – Confirmar recebimento de itens para troca; RF0045 – Gerar cupom de troca após recebimento de itens.",
        "RF0025 – Consulta de transações; RF0026 – Cadastro de endereços de entrega; RF0027 – Cadastro de cartões de crédito; RF0053 – Dar baixa em estoque; RF0054 – Realizar reentrada em estoque."
    ])

    add_heading(doc, "5", "Tipo de Caso de Uso")
    table = doc.add_table(rows=2, cols=2)
    set_cell(table.cell(0, 0), "X", bold=True)
    set_cell(table.cell(0, 1), "Concreto (iniciado diretamente por um ator)")
    set_cell(table.cell(1, 0), "")
    set_cell(table.cell(1, 1), "Abstrato (não iniciado diretamente por um ator)")
    style_table(table, [Cm(1.2), Cm(15.5)])

    add_heading(doc, "6", "Atores")
    table = doc.add_table(rows=1, cols=3)
    for idx, value in enumerate(["Ator", "Tipo", "Atuação"]):
        set_cell(table.cell(0, idx), value, bold=True)
    for values in [
        ("Cliente", "Primário", "Gerencia o carrinho, finaliza a compra, consulta pedidos e solicita troca."),
        ("Administrador", "Primário", "Despacha compras aprovadas, confirma entregas, visualiza, autoriza e confirma trocas.")
    ]:
        cells = table.add_row().cells
        for idx, value in enumerate(values):
            set_cell(cells[idx], value)
    style_table(table, [Cm(3.0), Cm(2.8), Cm(10.9)])

    add_heading(doc, "7", "Pré-Condições")
    add_subheading(doc, "7.1", "Permissão de Usuário")
    add_list(doc, [
        "Para os passos do cliente, deve existir um cliente associado ao carrinho ou à compra consultada; endereços, cartões e transações usados nos fluxos pertencem ao respectivo perfil do cliente.",
        "Para despacho e confirmação de entrega, o ator deve possuir perfil de administrador e a compra deve estar no estado exigido pelo passo.",
        "Para solicitar troca, o item deve pertencer a compra com status ENTREGUE, conforme RN0043."
    ])

    add_heading(doc, "8", "Fluxo Principal")
    flow = [
        ("P1", "O Cliente adiciona um produto ao carrinho de compra. O Sistema verifica disponibilidade e quantidade em estoque antes da inclusão (RN0031)."),
        ("P1.1", "O Sistema bloqueia temporariamente os itens adicionados, considerando o prazo parametrizado a partir do último item incluído (RN0044)."),
        ("P2", "O Sistema exibe os itens do carrinho. O Cliente pode visualizar, alterar quantidade ou excluir itens (RF0031 e RF0032). Caso altere ou remova itens, segue A1."),
        ("P3", "O Cliente solicita a realização da compra a partir do carrinho (RF0033)."),
        ("P4", "O Sistema apresenta os endereços de entrega cadastrados. O Cliente seleciona um endereço ou informa um novo endereço; nesta última situação, segue A2 (RF0035 e RF0026)."),
        ("P5", "O Sistema calcula o frete com base nos itens selecionados e no endereço apontado pelo Cliente (RF0034)."),
        ("P6", "O Sistema apresenta cartões cadastrados, opção de novo cartão, cupom de troca e cupom promocional. O Cliente seleciona as formas de pagamento; para composição de pagamentos, segue A3 (RF0036, RF0037 e RF0027)."),
        ("P7", "O Cliente confirma endereço de entrega e formas de pagamento e solicita a finalização da compra (RF0038)."),
        ("P8", "O Sistema finaliza a compra e atribui o status EM PROCESSAMENTO (RF0038)."),
        ("P9", "O Sistema revalida o estoque. Se houver alteração de disponibilidade, segue E2 (RN0032)."),
        ("P10", "O Sistema valida cupons e o aceite da operadora de cartão, quando utilizado (RN0037). Se a validação não for bem-sucedida, segue E4."),
        ("P11", "O Sistema atribui o status APROVADA à compra com pagamento validado (RN0038) e realiza a baixa do estoque dos itens vendidos (RF0053)."),
        ("P12", "O Administrador consulta as vendas aprovadas e seleciona a compra para despacho (RF0039)."),
        ("P13", "O Sistema atribui o status EM TRANSPORTE à compra selecionada pelo Administrador (RF0039 e RN0039)."),
        ("P14", "O Administrador confirma a entrega da compra (RF0040)."),
        ("P15", "O Sistema atribui o status ENTREGUE à compra confirmada como entregue (RF0040 e RN0040)."),
        ("P16", "O Cliente consulta a transação e a compra entregue. Caso solicite a troca de um item, segue P18; caso contrário, o caso de uso é concluído (RF0025)."),
        ("P17", "O Sistema mantém a compra entregue disponível para consulta conforme os dados da transação do Cliente (RF0025)."),
        ("P18", "O Cliente seleciona item de compra ENTREGUE e solicita troca (RF0041 e RN0043)."),
        ("P19", "O Sistema gera o pedido de troca e atribui o status EM TROCA; se a troca abranger toda a compra, atribui esse status à compra (RN0041)."),
        ("P20", "O Administrador visualiza pedidos de troca ou compras com status EM TROCA (RF0043)."),
        ("P21", "O Administrador autoriza a troca. O Sistema atribui o status TROCA AUTORIZADA e gera notificação ao Cliente (RF0042 e RN0046)."),
        ("P22", "O Administrador confirma o recebimento dos itens, informa se devem retornar ao estoque e o Sistema realiza a reentrada quando indicada, gera cupom de troca e atribui o status TROCADO (RF0044, RF0045, RF0054 e RN0042).")
    ]
    for code, text in flow:
        add_flow_step(doc, code, text)

    add_subheading(doc, "8.1", "Controle de Estados da Compra e da Troca")
    table = doc.add_table(rows=1, cols=4)
    for idx, value in enumerate(["Estado", "Passo", "Evento de transição", "Ator"]):
        set_cell(table.cell(0, idx), value, bold=True)
    states = [
        ("EM PROCESSAMENTO", "P8", "Finalização da compra", "Cliente"),
        ("APROVADA", "P11", "Validação de pagamento bem-sucedida", "Sistema"),
        ("REPROVADA", "E4", "Validação de pagamento sem sucesso", "Sistema"),
        ("EM TRANSPORTE", "P13", "Seleção da venda aprovada para despacho", "Administrador"),
        ("ENTREGUE", "P15", "Confirmação da entrega", "Administrador"),
        ("EM TROCA", "P19", "Solicitação de troca", "Cliente"),
        ("TROCA AUTORIZADA", "P21", "Autorização da troca", "Administrador"),
        ("TROCADO", "P22", "Confirmação de recebimento dos itens", "Administrador")
    ]
    for values in states:
        cells = table.add_row().cells
        for idx, value in enumerate(values):
            set_cell(cells[idx], value)
    style_table(table, [Cm(3.2), Cm(1.5), Cm(8.0), Cm(3.0)])

    add_heading(doc, "9", "Fluxos Alternativos")
    alternatives = [
        ("A1", "Alterar quantidade ou remover item", "Executado a partir de P2 quando o Cliente altera quantidade ou exclui item. O Sistema valida novamente a quantidade disponível (RN0031), atualiza o carrinho e retorna a P2."),
        ("A2", "Cadastrar novo endereço ou cartão", "Executado a partir de P4 ou P6 quando o Cliente informa novo endereço ou novo cartão. O Sistema possibilita incorporá-lo ao perfil do Cliente (RF0035, RF0036, RF0026 e RF0027) e retorna ao passo que o originou."),
        ("A3", "Composição de pagamento", "Executado a partir de P6 quando o Cliente combina cupons e cartões. O Sistema permite somente um cupom promocional por compra (RN0033), aplica a regra de valor mínimo por cartão (RN0034) e considera o valor máximo dos cupons na combinação com cartão (RN0035). Quando o valor dos cupons superar o da compra dentro das combinações permitidas, gera cupom de troca com a diferença (RN0036). Retorna a P7."),
        ("A4", "Encerrar após entrega", "Executado a partir de P16 quando o Cliente não solicita troca. O caso de uso é concluído com a compra no status ENTREGUE.")
    ]
    for code, title, text in alternatives:
        add_subheading(doc, code, title)
        add_body(doc, text)

    add_heading(doc, "10", "Fluxos de Exceção")
    exceptions = [
        ("E1", "Estoque insuficiente na inclusão", "A partir de P1, se o item não estiver disponível ou a quantidade solicitada superar o estoque, o Sistema impede a inclusão e informa a indisponibilidade ao Cliente (RN0031). Retorna a P2."),
        ("E2", "Alteração de estoque antes da finalização", "A partir de P9, se a disponibilidade tiver sido alterada, o Sistema notifica o Cliente, atualiza a quantidade disponível no carrinho e remove itens indisponíveis, quando necessário (RN0032). Retorna a P2."),
        ("E3", "Expiração do bloqueio do carrinho", "A partir de P1.1 ou P2, o Sistema notifica o Cliente cinco minutos antes do vencimento. Se o prazo expirar, remove e desbloqueia os itens; a listagem apresenta os itens retirados, desabilita a opção de comprar e exige nova inclusão (RN0044, RN0045 e RNF0042). Retorna a P2."),
        ("E4", "Pagamento reprovado ou inválido", "A partir de P10, se cupons não forem válidos ou a operadora não aceitar o cartão, o Sistema atribui o status REPROVADA (RN0037 e RN0038), apresenta o resultado ao Cliente e encerra o fluxo de compra."),
        ("E5", "Solicitação de troca não permitida", "A partir de P18, se o item não pertencer a compra ENTREGUE, o Sistema não gera o pedido de troca e apresenta a restrição ao Cliente (RN0043). Retorna a P16.")
    ]
    for code, title, text in exceptions:
        add_subheading(doc, code, title)
        add_body(doc, text)

    add_heading(doc, "11", "Protótipos de Tela")
    add_body(doc, "As subseções a seguir reservam o local para inserção dos protótipos reais do frontend. Cada tabela identifica os elementos e os passos do fluxo aos quais a tela está vinculada.")

    add_placeholder(doc, "11.1 Tela de Carrinho de Compra", "P1 a P3, A1 e E1 a E3", [
        ("Itens do carrinho", "Listagem", "Informativo", "Variável", "Exibe os itens adicionados e sua disponibilidade; corresponde a P2."),
        ("Quantidade", "Campo numérico", "Editável", "Curto", "Permite alterar a quantidade do item; corresponde a A1 e RF0032."),
        ("Remover item", "Botão", "Disponível", "—", "Exclui item do carrinho; corresponde a A1."),
        ("Tempo de bloqueio", "Informativo", "Somente leitura", "Curto", "Apresenta aviso de expiração; corresponde a E3."),
        ("Comprar", "Botão", "Condicional", "—", "Inicia P3; fica desabilitado para itens removidos por expiração, conforme RNF0042.")
    ])
    add_placeholder(doc, "11.2 Checkout: Endereço e Frete", "P4 a P5 e A2", [
        ("Endereços de entrega", "Seleção", "Obrigatório", "Variável", "Permite escolher endereço cadastrado; corresponde a P4."),
        ("Novo endereço", "Ação", "Opcional", "—", "Permite informar novo endereço e incorporar ao perfil; corresponde a A2."),
        ("Frete", "Informativo", "Somente leitura", "Curto", "Apresenta valor calculado para itens e endereço; corresponde a P5."),
        ("Prosseguir", "Botão", "Condicional", "—", "Avança para seleção de pagamento após a escolha do endereço.")
    ])
    add_placeholder(doc, "11.3 Pagamento e Finalização", "P6 a P10, A2, A3 e E4", [
        ("Cartões de crédito", "Seleção", "Opcional", "Variável", "Permite selecionar cartões cadastrados; corresponde a P6."),
        ("Novo cartão", "Ação", "Opcional", "—", "Permite cadastrar cartão e incorporá-lo ao perfil; corresponde a A2."),
        ("Cupom promocional", "Campo", "Opcional", "Curto", "Permite um cupom promocional por compra; corresponde a A3 e RN0033."),
        ("Cupom de troca", "Seleção", "Opcional", "Variável", "Permite usar cupom de troca válido; corresponde a P6 e A3."),
        ("Finalizar compra", "Botão", "Condicional", "—", "Confirma endereço e pagamento; corresponde a P7 e P8.")
    ])
    add_placeholder(doc, "11.4 Consulta e Confirmação de Pedido", "P11 a P17 e E4", [
        ("Status da compra", "Informativo", "Somente leitura", "Curto", "Exibe EM PROCESSAMENTO, APROVADA, REPROVADA, EM TRANSPORTE ou ENTREGUE."),
        ("Itens da compra", "Listagem", "Informativo", "Variável", "Exibe itens e dados da transação; corresponde a P16 e P17."),
        ("Resultado do pagamento", "Mensagem", "Condicional", "Variável", "Apresenta aprovação ou reprovação; corresponde a P10, P11 e E4."),
        ("Solicitar troca", "Botão", "Condicional", "—", "Disponível apenas para item de compra ENTREGUE; corresponde a P18.")
    ])
    add_placeholder(doc, "11.5 Painel Administrativo: Despacho e Entrega", "P12 a P15", [
        ("Vendas aprovadas", "Listagem", "Informativo", "Variável", "Exibe compras elegíveis ao despacho; corresponde a P12."),
        ("Despachar", "Botão", "Condicional", "—", "Atribui EM TRANSPORTE à compra selecionada; corresponde a P13."),
        ("Confirmar entrega", "Botão", "Condicional", "—", "Confirma entrega e atribui ENTREGUE; corresponde a P14 e P15."),
        ("Status", "Informativo", "Somente leitura", "Curto", "Apresenta o estado atual da compra.")
    ])
    add_placeholder(doc, "11.6 Solicitação de Troca pelo Cliente", "P18 a P19 e E5", [
        ("Itens entregues", "Listagem", "Informativo", "Variável", "Exibe itens aptos a solicitação de troca; corresponde a P18."),
        ("Solicitar troca", "Botão", "Condicional", "—", "Gera pedido de troca para item entregue; corresponde a P18."),
        ("Status da troca", "Informativo", "Somente leitura", "Curto", "Exibe EM TROCA ou TROCA AUTORIZADA; corresponde a P19 e P21."),
        ("Mensagem de restrição", "Mensagem", "Condicional", "Variável", "Apresenta impossibilidade de troca para item não entregue; corresponde a E5.")
    ])
    add_placeholder(doc, "11.7 Gestão de Trocas pelo Administrador", "P20 a P22", [
        ("Pedidos de troca", "Listagem", "Informativo", "Variável", "Exibe pedidos e compras com status EM TROCA; corresponde a P20."),
        ("Autorizar troca", "Botão", "Condicional", "—", "Atribui TROCA AUTORIZADA e notifica o Cliente; corresponde a P21."),
        ("Confirmar recebimento", "Botão", "Condicional", "—", "Confirma recebimento de itens; corresponde a P22."),
        ("Retornar ao estoque", "Seleção", "Obrigatório", "Curto", "Informa se os itens devem retornar ao estoque; corresponde a P22."),
        ("Cupom de troca", "Informativo", "Condicional", "Curto", "Disponibiliza cupom gerado após o recebimento; corresponde a P22.")
    ])

    add_heading(doc, "12", "Pós-Condições")
    add_subheading(doc, "12.1", "Estados Pós-Execução")
    add_list(doc, [
        "A compra pode permanecer EM PROCESSAMENTO durante a validação, ou finalizar com status APROVADA ou REPROVADA, conforme o resultado do pagamento.",
        "Uma compra aprovada pode avançar para EM TRANSPORTE e ENTREGUE pelas ações do Administrador.",
        "Uma troca solicitada pode resultar em EM TROCA, TROCA AUTORIZADA e TROCADO; após recebimento, o cupom de troca é disponibilizado e a reentrada em estoque ocorre quando indicada pelo Administrador.",
        "O Cliente pode consultar as transações realizadas conforme RF0025."
    ])

    add_heading(doc, "13", "Requisitos Não-Funcionais")
    add_list(doc, [
        "RNF0011 – Tempo de resposta para consultas: consultas de usuário devem responder em no máximo 1 segundo.",
        "RNF0012 – Log de transação: operações de inserção ou alteração devem registrar data, hora, usuário responsável e dados alterados.",
        "RNF0034 – Alteração apenas de endereços: endereços de entrega ou cobrança podem ser alterados ou adicionados sem editar os demais dados cadastrais.",
        "RNF0042 – Apresentar itens retirados do carrinho: itens removidos por prazo de finalização devem ser apresentados na listagem e exigir nova inclusão."
    ])

    add_heading(doc, "14", "Ponto de Extensão")
    table = doc.add_table(rows=1, cols=3)
    for idx, value in enumerate(["Relacionamento", "Ponto do fluxo", "Finalidade"]):
        set_cell(table.cell(0, idx), value, bold=True)
    extensions = [
        ("<<include>> Selecionar endereço de entrega", "P4", "Selecionar endereço existente ou cadastrar novo endereço, conforme RF0035."),
        ("<<include>> Calcular frete", "P5", "Calcular frete conforme itens e endereço, conforme RF0034."),
        ("<<include>> Selecionar e validar forma de pagamento", "P6 a P10", "Selecionar cartões e cupons e validar a forma de pagamento, conforme RF0036, RF0037 e RN0037."),
        ("<<extend>> Solicitar troca", "P16", "Permitir a solicitação apenas para item de compra ENTREGUE, conforme RF0041 e RN0043."),
        ("<<include>> Autorizar e confirmar troca", "P20 a P22", "Autorizar troca, confirmar recebimento, efetuar reentrada e gerar cupom, conforme RF0042, RF0044, RF0045 e RF0054.")
    ]
    for values in extensions:
        cells = table.add_row().cells
        for idx, value in enumerate(values):
            set_cell(cells[idx], value)
    style_table(table, [Cm(5.8), Cm(2.5), Cm(9.1)])

    add_heading(doc, "15", "Critérios de Aceite")
    add_list(doc, [
        "O sistema permite adicionar, alterar, visualizar e excluir itens do carrinho, respeitando a disponibilidade de estoque.",
        "Itens bloqueados são notificados antes da expiração e removidos/desbloqueados ao fim do prazo, com a opção de compra desabilitada até nova inclusão.",
        "A compra somente é finalizada após seleção de endereço e forma de pagamento e recebe EM PROCESSAMENTO.",
        "A validação de pagamento atribui APROVADA ou REPROVADA; somente a compra aprovada segue para despacho.",
        "Despacho e confirmação de entrega, executados pelo Administrador, atribuem EM TRANSPORTE e ENTREGUE, respectivamente.",
        "A troca só é solicitada para item de compra ENTREGUE e percorre os estados EM TROCA, TROCA AUTORIZADA e TROCADO.",
        "A confirmação de recebimento permite informar reentrada em estoque e disponibiliza cupom de troca ao Cliente."
    ])

    add_heading(doc, "16", "Observações")
    add_subheading(doc, "16.1", "Prioridade de Desenvolvimento")
    add_body(doc, "Alta. A Gestão de Vendas concentra os fluxos de compra, pagamento, entrega e troca do e-commerce.")
    add_subheading(doc, "16.2", "Inconsistências e Lacunas Identificadas no DRS")
    add_list(doc, [
        "RF0042 e RN0046 determinam a transição para TROCA AUTORIZADA após a autorização. Entretanto, RF0044 e RN0042 ainda referenciam confirmação de recebimento de pedido ou compra em EM TROCA. O DRS não define expressamente a transição entre TROCA AUTORIZADA e o recebimento.",
        "RN0044 afirma que o bloqueio é retirado quando a compra não é efetivada ou aprovada, mas a redação não define com precisão o efeito do bloqueio após aprovação nem sua relação com a baixa de estoque.",
        "RF0053 exige baixa de estoque para cada venda realizada, mas o DRS não associa explicitamente essa baixa a um dos estados de aprovação. Nesta especificação, a relação com APROVADA é apresentada como encadeamento do fluxo de vendas e deve ser validada com a parte interessada.",
        "O DRS identifica o perfil de administrador para ações operacionais, mas não define requisito específico de autenticação ou autorização. As pré-condições registram somente os perfis explicitamente mencionados no DRS."
    ])

    add_heading(doc, "17", "Referências")
    add_list(doc, [
        "DRS_LES_2_2026 – Documento de Requisitos da JoStore, versão 0.7.",
        "UC_FATEC – Template de Especificação de Caso de Uso fornecido para a atividade."
    ])


def replace_index(document):
    body = document._body._element
    index_element = None
    first_content = None
    for child in list(body):
        if child.tag != qn("w:p"):
            continue
        text = "".join(node.text or "" for node in child.iter(qn("w:t"))).strip()
        if text == "Índice":
            index_element = child
        elif index_element is not None and text == "1. NOME DO CASO DE USO":
            first_content = child
            break
    if index_element is None or first_content is None:
        raise RuntimeError("Não foi possível localizar o índice do template.")

    remove = False
    for child in list(body):
        if child is index_element:
            remove = True
            continue
        if child is first_content:
            break
        if remove:
            body.remove(child)

    entries = [
        "1. NOME DO CASO DE USO", "2. OBJETIVO", "3. DESCRIÇÃO", "4. REQUISITOS FUNCIONAIS",
        "5. TIPO DE CASO DE USO", "6. ATORES", "7. PRÉ-CONDIÇÕES", "7.1. Permissão de Usuário",
        "8. FLUXO PRINCIPAL", "9. FLUXOS ALTERNATIVOS", "10. FLUXOS DE EXCEÇÃO", "11. PROTÓTIPOS DE TELA",
        "11.1. Carrinho de Compra", "11.2. Checkout: Endereço e Frete", "11.3. Pagamento e Finalização",
        "11.4. Consulta e Confirmação de Pedido", "11.5. Despacho e Entrega", "11.6. Solicitação de Troca",
        "11.7. Gestão de Trocas", "12. PÓS-CONDIÇÕES", "13. REQUISITOS NÃO-FUNCIONAIS",
        "14. PONTO DE EXTENSÃO", "15. CRITÉRIOS DE ACEITE", "16. OBSERVAÇÕES", "17. REFERÊNCIAS"
    ]
    insert_at = list(body).index(index_element) + 1
    for entry in entries:
        paragraph = document.add_paragraph(style="Normal")
        paragraph.paragraph_format.left_indent = Cm(0.55 if entry.startswith("11.") or entry.startswith("7.1") else 0)
        paragraph.paragraph_format.space_after = Pt(1)
        paragraph.add_run(entry)
        body.remove(paragraph._p)
        body.insert(insert_at, paragraph._p)
        insert_at += 1

    Paragraph(first_content, document._body).paragraph_format.page_break_before = True


doc = Document(TEMPLATE)
update_cover(doc)
remove_body_after(doc, "Nome do Caso de Uso")
build_body(doc)
replace_index(doc)
doc.core_properties.title = "Especificação de Caso de Uso Gestão de Vendas"
doc.core_properties.author = "Andrey Marques"
doc.core_properties.subject = "JoStore"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
