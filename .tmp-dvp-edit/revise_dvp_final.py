import os
from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


SOURCE = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx")
ROOT = Path(r"C:\Projetos\JoStore - Projeto\JoStore")
BACKUP = ROOT / "docs" / "DVP_Backup_antes_revisao_geral.docx"
ASSETS = ROOT / ".tmp-dvp-edit" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


def get_font(size, bold=False):
    path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(path, size)


TITLE = get_font(40, True)
SUBTITLE = get_font(24)
NAME = get_font(25, True)
TEXT = get_font(20)
LABEL = get_font(18)


def rounded(draw, box, fill, outline="#334155", width=3):
    draw.rounded_rectangle(box, radius=16, fill=fill, outline=outline, width=width)


def centered(draw, box, content, font, fill="#111827"):
    bbox = draw.multiline_textbbox((0, 0), content, font=font, align="center", spacing=4)
    x = box[0] + (box[2] - box[0] - (bbox[2] - bbox[0])) / 2
    y = box[1] + (box[3] - box[1] - (bbox[3] - bbox[1])) / 2
    draw.multiline_text((x, y), content, font=font, fill=fill, align="center", spacing=4)


def connector(draw, points, label=None, position=None):
    draw.line(points, fill="#64748b", width=4, joint="curve")
    if label and position:
        draw.text(position, label, font=LABEL, fill="#334155", anchor="mm")


def box(draw, bounds, name, description, fill):
    rounded(draw, bounds, fill)
    centered(draw, (bounds[0] + 10, bounds[1] + 14, bounds[2] - 10, bounds[1] + 78), name, NAME)
    centered(draw, (bounds[0] + 14, bounds[1] + 82, bounds[2] - 14, bounds[3] - 12), description, TEXT, "#334155")


def create_full_logical_model(path):
    image = Image.new("RGB", (2500, 1400), "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.text((1250, 42), "Modelo Lógico de Dados da JoStore", font=TITLE, fill="#111827", anchor="ma")
    draw.text((1250, 96), "Entidades implementadas no módulo de clientes e entidades planejadas para o e-commerce", font=SUBTITLE, fill="#475569", anchor="ma")
    draw.text((425, 190), "MÓDULO DE CLIENTES - IMPLEMENTADO", font=NAME, fill="#1d4ed8", anchor="ma")
    draw.text((1510, 190), "MÓDULOS DE E-COMMERCE - PLANEJADOS", font=NAME, fill="#92400e", anchor="ma")

    implemented = "#dbeafe"
    planned = "#fef3c7"
    boxes = {
        "Cliente": ((80, 300, 380, 465), "dados pessoais, status\ne código", implemented),
        "Usuário": ((80, 600, 380, 750), "e-mail e senha\ncriptografada", implemented),
        "Endereço": ((470, 300, 770, 465), "residência, cobrança\ne entrega", implemented),
        "Cartão": ((470, 600, 770, 750), "titular, bandeira\ne últimos 4 dígitos", implemented),
        "Carrinho": ((900, 220, 1180, 370), "itens escolhidos\npelo cliente", planned),
        "Item do\nCarrinho": ((900, 500, 1180, 650), "quantidade e\nvariação selecionada", planned),
        "Pedido": ((1280, 220, 1560, 370), "status, total\ne endereço de entrega", planned),
        "Item do\nPedido": ((1280, 500, 1560, 650), "produto, quantidade\ne valor registrado", planned),
        "Pagamento": ((1280, 780, 1560, 930), "valor, status\ne forma de pagamento", planned),
        "Troca": ((1660, 220, 1940, 370), "solicitação, motivo\ne situação", planned),
        "Cupom": ((1660, 500, 1940, 650), "código, regra\ne desconto", planned),
        "Categoria": ((2060, 190, 2380, 335), "nome e descrição", planned),
        "Produto": ((2060, 445, 2380, 605), "nome, descrição\ne preço base", planned),
        "Variação de\nProduto": ((2060, 700, 2380, 860), "SKU, tamanho, cor\ne preço", planned),
        "Estoque": ((2060, 970, 2380, 1120), "quantidade disponível\ne movimentações", planned),
    }
    for name, (bounds, description, fill) in boxes.items():
        box(draw, bounds, name, description, fill)

    connector(draw, [(230, 465), (230, 600)], "1 : 1", (285, 535))
    connector(draw, [(380, 380), (470, 380)], "1 : 0..*", (425, 350))
    connector(draw, [(380, 430), (425, 430), (425, 675), (470, 675)], "1 : 0..*", (430, 540))
    connector(draw, [(1040, 370), (1040, 500)], "1 : 1..*", (1100, 435))
    connector(draw, [(1420, 370), (1420, 500)], "1 : 1..*", (1480, 435))
    connector(draw, [(1420, 650), (1420, 780)], "1 : 1", (1480, 715))
    connector(draw, [(1560, 295), (1660, 295)], "1 : 0..*", (1610, 265))
    connector(draw, [(1560, 330), (1615, 330), (1615, 575), (1660, 575)], "0..* : 0..1", (1605, 470))
    connector(draw, [(2220, 335), (2220, 445)], "1 : 0..*", (2280, 390))
    connector(draw, [(2220, 605), (2220, 700)], "1 : 1..*", (2280, 655))
    connector(draw, [(2220, 860), (2220, 970)], "1 : 1", (2280, 915))
    connector(draw, [(1040, 650), (1040, 690), (2020, 690), (2020, 780), (2060, 780)], "0..* : 1", (1600, 720))
    connector(draw, [(1420, 650), (1420, 670), (2000, 670), (2000, 750), (2060, 750)], "0..* : 1", (1770, 640))

    draw.text((1250, 1245), "Azul: entidades persistidas no módulo de clientes. Amarelo: entidades previstas para as próximas etapas.", font=LABEL, fill="#475569", anchor="ms")
    image.save(path, quality=95)


def clear_paragraph(paragraph):
    p_pr = paragraph._p.pPr
    for child in list(paragraph._p):
        if child is not p_pr:
            paragraph._p.remove(child)


def set_text(paragraph, text, bold_prefix=None):
    clear_paragraph(paragraph)
    if bold_prefix and text.startswith(bold_prefix):
        run = paragraph.add_run(bold_prefix)
        run.bold = True
        paragraph.add_run(text[len(bold_prefix):])
    else:
        paragraph.add_run(text)


def find_exact(document, text):
    for paragraph in document.paragraphs:
        if paragraph.text.strip() == text:
            return paragraph
    raise ValueError(f"Paragraph not found: {text}")


def find_starts(document, text):
    for paragraph in document.paragraphs:
        if paragraph.text.strip().startswith(text):
            return paragraph
    raise ValueError(f"Paragraph not found: {text}")


def drawing_paragraph(document, relationship_id):
    for paragraph in document.paragraphs:
        ids = [blip.get(qn("r:embed")) for blip in paragraph._p.xpath(".//a:blip")]
        if relationship_id in ids:
            return paragraph
    raise ValueError(f"Drawing not found: {relationship_id}")


def next_paragraph(document, paragraph):
    paragraphs = list(document.paragraphs)
    for index, candidate in enumerate(paragraphs):
        if candidate._p is paragraph._p:
            return paragraphs[index + 1]
    raise ValueError("Paragraph not found in document")


def paragraph_index(document, paragraph):
    for index, candidate in enumerate(document.paragraphs):
        if candidate._p is paragraph._p:
            return index
    raise ValueError("Paragraph not found in document")


def replace_figure(paragraph, image_path, description):
    clear_paragraph(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    inline = run.add_picture(str(image_path), width=Inches(6.2))
    inline._inline.docPr.set("descr", description)
    inline._inline.docPr.set("title", description)


def add_toc_field(paragraph):
    clear_paragraph(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = ' TOC \\t "PSDS - Marcadores Nivel 1,1,PSDS - Marcadores Nivel 2,2,Heading 2,2" \\h \\z '
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    result = OxmlElement("w:t")
    result.text = "Atualize o índice no Word (Ctrl+A e F9)."
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    paragraph.add_run()._r.append(begin)
    paragraph.add_run()._r.append(instr)
    paragraph.add_run()._r.append(separate)
    paragraph.add_run()._r.append(result)
    paragraph.add_run()._r.append(end)


def remove_paragraph(paragraph):
    paragraph._element.getparent().remove(paragraph._element)


def set_update_fields(document):
    settings = document.settings.element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def set_cell(cell, value, bold=False):
    paragraph = cell.paragraphs[0]
    clear_paragraph(paragraph)
    run = paragraph.add_run(value)
    run.bold = bold
    run.font.size = Pt(9)


def shade(cell, color):
    tc_pr = cell._tc.get_or_add_tcPr()
    node = OxmlElement("w:shd")
    node.set(qn("w:fill"), color)
    tc_pr.append(node)


create_full_logical_model(ASSETS / "modelo-logico-jostore-completo.png")
if os.environ.get("DVP_DIAGRAMS_ONLY") == "1":
    raise SystemExit(0)

copyfile(SOURCE, BACKUP)
document = Document(SOURCE)

# Histórico de versões.
history = document.tables[0]
row = history.add_row().cells
for cell, value in zip(row, ["24/09/2026", "1.1", "Revisão geral do DVP e atualização das visões técnicas", "Andrey Marques", "-"]):
    set_cell(cell, value)

# Índice atualizável, derivado dos estilos já usados no documento.
index_title = find_exact(document, "Índice")
paragraphs = list(document.paragraphs)
start = paragraph_index(document, index_title) + 1
objective = find_exact(document, "Objetivo")
end = paragraph_index(document, objective)
toc_paragraph = document.paragraphs[start]
for paragraph in list(document.paragraphs)[start + 1:end]:
    remove_paragraph(paragraph)
add_toc_field(toc_paragraph)
set_update_fields(document)

# Ajustes de conteúdo e nomenclatura.
set_text(find_starts(document, "O sistema deve ser compatível"), "O sistema deve ser compatível com as versões atuais dos navegadores Google Chrome, Microsoft Edge e Mozilla Firefox.")
set_text(find_exact(document, "O projeto será orientado pelo professor Rodrigo Rocha."), "")
set_text(find_exact(document, "Visão de Use Case"), "Visão de Casos de Uso")
set_text(find_exact(document, "Diagrama de Caso de uso de Pedidos"), "Diagrama de Casos de Uso de Pedidos")
set_text(find_starts(document, "Esta seção apresenta os casos de uso"), "Esta seção apresenta os casos de uso arquiteturalmente mais significativos da JoStore. O diagrama concentra o fluxo de pedidos, que envolve identificação do cliente, realização do pedido e solicitações de cancelamento ou troca. Ele representa o comportamento-alvo do sistema; a autenticação pela API será implementada em etapa posterior, substituindo o mecanismo temporário de acesso local usado no protótipo.")
set_text(find_starts(document, "Realizar Login/Cadastro:"), "Realizar Login/Cadastro: no fluxo-alvo, o cliente se identifica por meio de credenciais ou realiza seu cadastro. O sistema valida os dados e permite a continuidade do pedido. Na versão atual do protótipo, o acesso é mantido localmente; a autenticação da API permanece planejada.")
set_text(find_starts(document, "Apresentação: Contém classes"), "Apresentação: reúne o front-end React com TypeScript, organizado em páginas, componentes, estilos e serviços de comunicação com a API. Essa camada apresenta o catálogo, formulários de cadastro, perfil, carrinho e funcionalidades administrativas ao usuário.")
set_text(find_starts(document, "Negócio: Contém classes"), "Negócio: reúne os controllers e services do Spring Boot, responsáveis por receber requisições REST, aplicar regras de negócio e coordenar as operações do domínio.")
set_text(find_starts(document, "Persistência: Contém classes"), "Persistência: reúne as entidades JPA, repositories Spring Data e migrations Flyway que permitem consultar e persistir dados no PostgreSQL.")
set_text(find_starts(document, "O frontend e o backend são projetos independentes"), "O frontend e o backend são projetos independentes. O frontend é desenvolvido em React com TypeScript e é responsável pela interface do usuário. O backend é desenvolvido em Java com Spring Boot, seguindo a organização em camadas Controller, Service, Repository e Model, conforme detalhado na Visão de Lógica.")

# Modelo de dados completo e texto que diferencia planejamento de implementação.
set_text(find_starts(document, "As Figuras abaixo apresentam"), "As Figuras 15 e 16 apresentam, respectivamente, o modelo lógico completo planejado para a JoStore e o modelo físico atualmente implementado para o módulo de gestão de clientes. As entidades de catálogo, estoque, carrinho, pedidos, pagamentos, cupons e trocas guiam a evolução do banco nas próximas etapas, enquanto o modelo físico registra apenas as tabelas que já existem no PostgreSQL.")
logical = drawing_paragraph(document, "rId33")
replace_figure(logical, ASSETS / "modelo-logico-jostore-completo.png", "Modelo lógico planejado da JoStore")
set_text(next_paragraph(document, logical), "Figura 15 - Modelo lógico de dados planejado da JoStore")
physical = drawing_paragraph(document, "rId34")
set_text(next_paragraph(document, physical), "Figura 16 - Modelo físico de dados implementado para o módulo de clientes")
set_text(find_starts(document, "A Tabela 2 apresenta"), "A Tabela 2 apresenta o mapeamento entre as classes de modelo já implementadas no módulo de clientes e as entidades físicas persistidas no PostgreSQL.")

# Estimativas solicitadas pelo guia.
set_text(find_starts(document, "O JoStore é desenvolvido inicialmente"), "O JoStore é desenvolvido inicialmente como um e-commerce de pequeno porte e para fins acadêmicos. Para o piloto, estima-se até 200 contas cadastradas, cerca de 500 produtos e variações no catálogo, até 50 pedidos por dia e picos de aproximadamente 20 usuários simultâneos em campanhas e divulgações.")
set_text(find_starts(document, "Os momentos de maior uso"), "Os momentos de maior uso são esperados em campanhas, divulgações nas redes sociais e datas comerciais. Para esse cenário, as consultas administrativas de clientes utilizam paginação e filtros combináveis, e o banco de dados possui índices e restrições de unicidade para CPF, e-mail e código do cliente.")
set_text(find_starts(document, "A infraestrutura atual é local"), "A infraestrutura atual é local, composta pela aplicação Spring Boot e pelo PostgreSQL em Docker. Caso o volume real ultrapasse essas estimativas, o dimensionamento de recursos, o monitoramento e as estratégias de cópia de segurança deverão ser revisados antes da implantação em produção.")

# Qualidade sem sobreafirmar testes integrados que ainda não existem.
set_text(find_starts(document, "Quanto à segurança"), "Quanto à segurança, as senhas são criptografadas antes do armazenamento. O sistema não persiste o número completo ou o código de segurança de cartões. Os fluxos de interface do CRUD de clientes possuem testes automatizados com Cypress; testes de integração completos entre interface, API e banco serão ampliados nas próximas etapas.")

# Cronograma com semanas, conforme o guia.
schedule = document.tables[5]
values = [
    ("Marco", "Semana / situação"),
    ("Documento de Visão de Projeto e requisitos iniciais", "Semanas 1 e 2 - Concluído"),
    ("Protótipo da interface em React", "Semanas 3 a 5 - Concluído"),
    ("Modelagem do banco e CRUD de clientes", "Semanas 6 a 10 - Concluído"),
    ("Integração do front-end com a API de clientes", "Semanas 9 e 10 - Concluído"),
    ("Catálogo de produtos e gestão de estoque", "Semanas 11 a 13 - Próxima etapa"),
    ("Carrinho, checkout e fluxo de pedidos", "Semanas 14 a 17 - Planejado"),
    ("Trocas, cupons e relatórios administrativos", "Semanas 18 e 19 - Planejado"),
    ("Testes integrados, documentação e apresentação", "Semanas 20 e 21 - Fase final"),
]
for row, pair in zip(schedule.rows, values):
    for cell, value in zip(row.cells, pair):
        set_cell(cell, value, bold=row is schedule.rows[0])
        if row is schedule.rows[0]:
            shade(cell, "D9EAF7")

# Legendas e referências das figuras existentes.
captions = {
    "rId20": "Figura 2 - Diagrama de casos de uso de pedidos",
    "rId21": "Figura 3 - Organização lógica em camadas",
    "rId22": "Figura 4 - Tecnologias associadas às camadas da JoStore",
    "rId23": "Figura 5 - Pacotes da camada de apresentação",
    "rId24": "Figura 6 - Pacotes da camada de negócio",
    "rId25": "Figura 7 - Classes de controle do módulo de clientes",
    "rId26": "Figura 8 - Classes de controle complementares",
    "rId27": "Figura 9 - Classes de modelo do módulo de clientes",
    "rId28": "Figura 10 - Relacionamentos das classes do domínio",
    "rId29": "Figura 11 - Repositories do módulo de clientes",
    "rId30": "Figura 12 - Diagrama de sequência da realização de pedido",
    "rId31": "Figura 13 - Colaboração entre camadas no fluxo de pedido",
    "rId32": "Figura 14 - Visão de implantação da JoStore",
}
for relationship_id, caption in captions.items():
    image_paragraph = drawing_paragraph(document, relationship_id)
    following = next_paragraph(document, image_paragraph)
    if following.text.strip() == "":
        set_text(following, caption)

document.save(SOURCE)
print(SOURCE)
