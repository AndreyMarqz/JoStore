from copy import deepcopy
import os
from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(r"C:\Projetos\JoStore - Projeto\JoStore")
SOURCE = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx")
OUTPUT = SOURCE
BACKUP = ROOT / "docs" / "DVP_Backup_antes_da_atualizacao_visao_dados.docx"
ASSETS = ROOT / ".tmp-dvp-edit" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


TITLE = font(39, True)
SUBTITLE = font(24, False)
TABLE_TITLE = font(25, True)
TABLE_TEXT = font(21, False)
SMALL = font(18, False)


def rounded(draw, xy, fill, outline="#374151", width=3, radius=16):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def centered(draw, box, text, fnt, fill="#111827"):
    left, top, right, bottom = box
    bbox = draw.multiline_textbbox((0, 0), text, font=fnt, align="center", spacing=5)
    x = left + (right - left - (bbox[2] - bbox[0])) / 2
    y = top + (bottom - top - (bbox[3] - bbox[1])) / 2
    draw.multiline_text((x, y), text, font=fnt, fill=fill, align="center", spacing=5)


def arrow(draw, start, end, label=None, label_offset=(0, 0)):
    draw.line([start, end], fill="#4b5563", width=4)
    draw.polygon(
        [(end[0], end[1]), (end[0] - 16, end[1] - 9), (end[0] - 16, end[1] + 9)],
        fill="#4b5563",
    )
    if label:
        mid = ((start[0] + end[0]) / 2 + label_offset[0], (start[1] + end[1]) / 2 + label_offset[1])
        draw.text(mid, label, font=SMALL, fill="#374151", anchor="mm")


def poly_arrow(draw, points, label=None, label_at=None):
    draw.line(points, fill="#4b5563", width=4, joint="curve")
    previous, end = points[-2], points[-1]
    if abs(end[0] - previous[0]) >= abs(end[1] - previous[1]):
        direction = 1 if end[0] > previous[0] else -1
        head = [(end[0], end[1]), (end[0] - 17 * direction, end[1] - 10), (end[0] - 17 * direction, end[1] + 10)]
    else:
        direction = 1 if end[1] > previous[1] else -1
        head = [(end[0], end[1]), (end[0] - 10, end[1] - 17 * direction), (end[0] + 10, end[1] - 17 * direction)]
    draw.polygon(head, fill="#4b5563")
    if label and label_at:
        draw.text(label_at, label, font=SMALL, fill="#374151", anchor="mm")


def create_logical_diagram(path):
    image = Image.new("RGB", (1920, 1280), "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.text((960, 45), "Modelo Lógico de Dados - Módulo de Clientes", font=TITLE, fill="#111827", anchor="ma")
    draw.text((960, 98), "Entidades persistentes atualmente implementadas na JoStore", font=SUBTITLE, fill="#4b5563", anchor="ma")

    boxes = {
        "Cliente": (760, 235, 1160, 430),
        "Usuário": (100, 235, 500, 415),
        "Telefone": (100, 700, 500, 875),
        "Endereço": (1420, 225, 1820, 430),
        "Cartão de\nCrédito": (760, 700, 1160, 875),
        "Finalidade\ndo Endereço": (1420, 700, 1820, 875),
        "Tipo de\nResidência": (1180, 1035, 1450, 1195),
        "Tipo de\nLogradouro": (1540, 1035, 1810, 1195),
    }
    descriptions = {
        "Cliente": "dados pessoais, status e código",
        "Usuário": "e-mail e senha criptografada",
        "Telefone": "tipo, DDD e número",
        "Endereço": "identificação, localização e CEP",
        "Cartão de\nCrédito": "titular, bandeira, últimos 4 dígitos",
        "Tipo de\nResidência": "domínio cadastrado",
        "Tipo de\nLogradouro": "domínio cadastrado",
        "Finalidade\ndo Endereço": "residência, cobrança\ne entrega",
    }
    for name, box in boxes.items():
        color = "#dbeafe" if name == "Cliente" else "#f3f4f6"
        rounded(draw, box, color)
        centered(draw, (box[0], box[1] + 15, box[2], box[1] + 83), name, TABLE_TITLE)
        centered(draw, (box[0] + 15, box[1] + 85, box[2] - 15, box[3] - 12), descriptions[name], SMALL, "#374151")

    arrow(draw, (500, 325), (760, 325), "1 : 1", (0, -24))
    arrow(draw, (1160, 325), (1420, 325), "1 : 0..*", (0, -24))
    poly_arrow(draw, [(500, 785), (610, 785), (610, 560), (850, 560), (850, 430)], "0..* : 1", (620, 535))
    arrow(draw, (960, 430), (960, 700), "1 : 0..*", (52, 0))
    arrow(draw, (1620, 430), (1620, 700), "1 : 1..*", (65, 0))
    poly_arrow(draw, [(1420, 380), (1280, 380), (1280, 965), (1315, 965), (1315, 1035)], "0..* : 1", (1190, 610))
    poly_arrow(draw, [(1820, 380), (1870, 380), (1870, 965), (1675, 965), (1675, 1035)], "0..* : 1", (1840, 620))

    draw.text((960, 1240), "Legenda: 1 = uma ocorrência | 0..* = nenhuma ou várias ocorrências", font=SMALL, fill="#4b5563", anchor="ms")
    image.save(path, quality=95)


def draw_table(draw, box, title, rows):
    left, top, right, bottom = box
    rounded(draw, box, "#ffffff", "#374151", width=3, radius=10)
    draw.rounded_rectangle((left, top, right, top + 48), radius=10, fill="#dbeafe", outline="#374151", width=3)
    draw.rectangle((left, top + 35, right, top + 48), fill="#dbeafe")
    draw.text(((left + right) / 2, top + 24), title, font=TABLE_TITLE, fill="#111827", anchor="mm")
    y = top + 66
    for row in rows:
        draw.text((left + 18, y), row, font=TABLE_TEXT, fill="#1f2937")
        y += 30


def create_physical_diagram(path):
    image = Image.new("RGB", (2400, 1900), "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.text((1200, 38), "Modelo Físico de Dados - PostgreSQL", font=TITLE, fill="#111827", anchor="ma")
    draw.text((1200, 90), "Estrutura atual de persistência do módulo de clientes", font=SUBTITLE, fill="#4b5563", anchor="ma")

    tables = {
        "usuarios": ((90, 170, 650, 400), ["PK  usu_id : UUID", "    usu_email : VARCHAR(254)", "    usu_senha : VARCHAR(60)"]),
        "clientes": ((840, 150, 1500, 540), ["PK  cli_id : UUID", "    cli_code : VARCHAR(10)", "    cli_nome : VARCHAR(150)", "    cli_dta_nasc : DATE", "    cli_cpf : VARCHAR(11)", "    cli_gen : VARCHAR(30)", "FK  cli_login : UUID", "    cli_status : VARCHAR(10)", "    cli_created_at : TIMESTAMP", "    cli_updated_at : TIMESTAMP"]),
        "telefones": ((90, 700, 650, 970), ["PK  tel_id : UUID", "FK  tel_cli_id : UUID", "    tel_tipo : VARCHAR(30)", "    tel_ddd : VARCHAR(2)", "    tel_num : VARCHAR(9)"]),
        "enderecos": ((840, 680, 1500, 1160), ["PK  end_id : UUID", "FK  end_cli_id : UUID", "    end_nome_ident : VARCHAR(60)", "FK  end_tipo_resid : UUID", "FK  end_tipo_lograd : UUID", "    end_lograd : VARCHAR(150)", "    end_num, end_bairro, end_cep", "    end_cidade, end_estado, end_pais", "    end_obs : VARCHAR(500)"]),
        "cartoes_credito": ((90, 1280, 650, 1570), ["PK  cart_id : UUID", "FK  cart_cli_id : UUID", "    cart_last4 : VARCHAR(4)", "    cart_nome_impr : VARCHAR(150)", "    cart_band : VARCHAR(30)", "    cart_pref : BOOLEAN"]),
        "enderecos_finalidades": ((840, 1310, 1500, 1525), ["PK/FK  end_id : UUID", "PK      end_finalidade : VARCHAR(20)"]),
        "tipos_residencia": ((1660, 720, 2310, 955), ["PK  tip_resid_id : UUID", "    tip_resid_desc : VARCHAR(60)"]),
        "tipos_logradouro": ((1660, 1060, 2310, 1295), ["PK  tip_lograd_id : UUID", "    tip_lograd_desc : VARCHAR(60)"]),
    }
    for title, (box, rows) in tables.items():
        draw_table(draw, box, title, rows)

    arrow(draw, (650, 285), (840, 285), "1:1", (0, -24))
    poly_arrow(draw, [(650, 840), (740, 840), (740, 455), (840, 455)], "N:1", (715, 620))
    poly_arrow(draw, [(650, 1425), (740, 1425), (740, 500), (840, 500)], "N:1", (710, 1100))
    arrow(draw, (1170, 540), (1170, 680), "1:N", (55, 0))
    arrow(draw, (1170, 1160), (1170, 1310), "1:N", (55, 0))
    arrow(draw, (1500, 800), (1660, 835), "N:1", (0, -25))
    arrow(draw, (1500, 1050), (1660, 1175), "N:1", (18, 12))

    draw.text((1200, 1840), "PK = chave primária | FK = chave estrangeira | UUID = identificador universal", font=SMALL, fill="#4b5563", anchor="ms")
    image.save(path, quality=95)


def clear_paragraph(paragraph):
    p_pr = paragraph._p.pPr
    for child in list(paragraph._p):
        if child is not p_pr:
            paragraph._p.remove(child)


def set_paragraph(paragraph, text, bold_prefix=None):
    clear_paragraph(paragraph)
    if bold_prefix and text.startswith(bold_prefix):
        run = paragraph.add_run(bold_prefix)
        run.bold = True
        paragraph.add_run(text[len(bold_prefix):])
    else:
        paragraph.add_run(text)


def set_cell(cell, text, bold=False):
    paragraph = cell.paragraphs[0]
    clear_paragraph(paragraph)
    run = paragraph.add_run(text)
    run.bold = bold
    run.font.size = Pt(9)
    for extra in cell.paragraphs[1:]:
        extra._element.getparent().remove(extra._element)


def shade_cell(cell, color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), color)
    tc_pr.append(shd)


def replace_figure(paragraph, image_path, width, description):
    clear_paragraph(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    inline = run.add_picture(str(image_path), width=Inches(width))
    inline._inline.docPr.set("descr", description)
    inline._inline.docPr.set("title", description)


def add_reference(document, text):
    paragraph = document.add_paragraph(style="Normal")
    paragraph.paragraph_format.space_after = Pt(5)
    paragraph.add_run(text)


create_logical_diagram(ASSETS / "modelo-logico-clientes.png")
create_physical_diagram(ASSETS / "modelo-fisico-clientes.png")
if os.environ.get("DVP_DIAGRAMS_ONLY") == "1":
    raise SystemExit(0)
copyfile(SOURCE, BACKUP)
document = Document(SOURCE)

# Preserve all material before the data vision. The following paragraph positions come
# from the source's stable body order and are within the user-requested edit scope.
set_paragraph(document.paragraphs[263], "Visão de Dados")
set_paragraph(
    document.paragraphs[265],
    "O mecanismo de persistência do JoStore utiliza o banco de dados relacional PostgreSQL 18, executado em contêiner Docker. O mapeamento objeto-relacional é realizado pelo Spring Data JPA, utilizando o Hibernate como implementação JPA. As alterações estruturais do banco são controladas por migrations do Flyway, enquanto as transações de negócio são delimitadas pelos serviços do Spring Framework.",
)
set_paragraph(
    document.paragraphs[267],
    "As Figuras 7 e 8 apresentam, respectivamente, a visão lógica e a visão física da base de dados atualmente implementada para o módulo de gestão de clientes. Os módulos de catálogo, estoque, carrinho, pedidos, pagamentos, cupons e trocas serão incorporados à modelagem nas próximas etapas de desenvolvimento.",
)
replace_figure(document.paragraphs[269], ASSETS / "modelo-logico-clientes.png", 6.2, "Modelo lógico do módulo de clientes da JoStore")
set_paragraph(document.paragraphs[270], "Figura 7 - Modelo lógico de dados do módulo de clientes")
replace_figure(document.paragraphs[273], ASSETS / "modelo-fisico-clientes.png", 6.2, "Modelo físico do módulo de clientes no PostgreSQL")
set_paragraph(document.paragraphs[274], "Figura 8 - Modelo físico de dados do módulo de clientes")
set_paragraph(
    document.paragraphs[276],
    "A Tabela 2 apresenta o mapeamento entre as principais classes de modelo do módulo de clientes e as entidades físicas persistidas no PostgreSQL.",
)
set_paragraph(
    document.paragraphs[277],
    "Os identificadores das entidades persistentes utilizam UUID. As tabelas também impõem restrições relevantes ao domínio, como unicidade para CPF, e-mail e código do cliente, além da validação de formatos e valores permitidos para status, gênero, telefones, finalidades de endereço e bandeiras de cartão.",
)
set_paragraph(
    document.paragraphs[278],
    "Os tipos de residência e de logradouro são mantidos em tabelas de domínio, permitindo que endereços façam referência a valores padronizados. As finalidades de um endereço são armazenadas na tabela associativa enderecos_finalidades, pois um mesmo endereço pode ser residencial, de cobrança e de entrega.",
)
set_paragraph(
    document.paragraphs[279],
    "Por segurança, a senha do usuário é armazenada de forma criptografada. Os dados completos do cartão e o código de segurança não são persistidos: o sistema mantém apenas o titular, a bandeira, os quatro últimos dígitos e a indicação de cartão preferencial.",
)
set_paragraph(document.paragraphs[281], "Tabela 2 - Mapeamento objeto-relacional do módulo de clientes")

mapping_table = document.tables[4]
while len(mapping_table.rows) < 9:
    mapping_table.add_row()
mapping = [
    ("Classe de modelo", "Entidade física"),
    ("Customer", "clientes"),
    ("User", "usuarios"),
    ("Phone", "telefones"),
    ("Address", "enderecos"),
    ("AddressPurposeEnum", "enderecos_finalidades"),
    ("CreditCard", "cartoes_credito"),
    ("ResidenceType", "tipos_residencia"),
    ("PublicPlaceType", "tipos_logradouro"),
]
for row, values in zip(mapping_table.rows, mapping):
    for cell, value in zip(row.cells, values):
        set_cell(cell, value, bold=row is mapping_table.rows[0])
        if row is mapping_table.rows[0]:
            shade_cell(cell, "D9EAF7")

set_paragraph(document.paragraphs[284], "Tamanho e Performance")
set_paragraph(
    document.paragraphs[286],
    "O JoStore é desenvolvido inicialmente para uma operação de pequeno e médio porte e para fins acadêmicos. Ainda assim, o sistema deve manter desempenho adequado nas ações mais frequentes de um e-commerce: navegação pelo catálogo, consulta de produtos, inclusão de itens no carrinho, consulta de pedidos e manutenção de clientes.",
)
set_paragraph(
    document.paragraphs[287],
    "Os momentos de maior uso são esperados em campanhas, divulgações nas redes sociais e períodos próximos a datas comerciais. Para atender a esse cenário, as consultas administrativas de clientes utilizam paginação e filtros combináveis, enquanto o banco de dados possui índices e restrições de unicidade para os campos de consulta mais relevantes, como CPF, e-mail e código do cliente.",
)
set_paragraph(
    document.paragraphs[288],
    "A infraestrutura atual é local, composta pela aplicação Spring Boot e pelo PostgreSQL em Docker. Em uma futura implantação, o dimensionamento de recursos, o monitoramento e as estratégias de cópia de segurança deverão ser definidos conforme o volume real de acessos, produtos e pedidos.",
)

set_paragraph(document.paragraphs[290], "Qualidade")
set_paragraph(
    document.paragraphs[292],
    "A qualidade do JoStore está centrada na confiabilidade dos fluxos de venda e na proteção dos dados cadastrais dos clientes. As regras de negócio são aplicadas na camada de serviços, e os dados recebidos pela API são validados por DTOs e pelas restrições do banco de dados antes de serem persistidos.",
)
set_paragraph(
    document.paragraphs[294],
    "A manutenção do sistema é favorecida pela arquitetura MVC e pela separação entre controllers, services, repositories, entidades, DTOs e tratamento centralizado de exceções. Essa organização reduz o acoplamento entre a interface web e a persistência e permite evoluir os módulos de catálogo, estoque, carrinho e pedidos sem concentrar regras em uma única camada.",
)
set_paragraph(
    document.paragraphs[296],
    "Quanto à segurança, as senhas são criptografadas antes do armazenamento. O sistema não persiste o número completo ou o código de segurança de cartões. Para o CRUD de clientes, os fluxos principais e as validações relevantes são cobertos por testes automatizados de interface com Cypress, conforme a orientação da disciplina.",
)
set_paragraph(
    document.paragraphs[297],
    "Nas próximas etapas, a autenticação da API, o controle de autorização por perfil, a observabilidade da aplicação e a política de cópias de segurança devem complementar os mecanismos já implementados.",
)

set_paragraph(document.paragraphs[300], "Cronograma Macro")
set_paragraph(
    document.paragraphs[302],
    "O cronograma a seguir organiza os principais marcos do desenvolvimento do JoStore. Os itens concluídos representam a base já construída; as etapas seguintes serão realizadas conforme o cronograma acadêmico e a evolução dos requisitos do e-commerce.",
)
schedule_table = document.tables[5]
schedule_table.cell(0, 0).text = "Marco"
schedule_table.cell(0, 1).text = "Situação / período"
schedule = [
    ("Documento de Visão de Projeto e requisitos iniciais", "Concluído"),
    ("Protótipo da interface em React", "Concluído"),
    ("Modelagem do banco e CRUD de clientes", "Concluído"),
    ("Integração do front-end com a API de clientes", "Concluído"),
    ("Catálogo de produtos e gestão de estoque", "Próxima etapa"),
    ("Carrinho, checkout e fluxo de pedidos", "Próxima etapa"),
    ("Trocas, cupons e relatórios administrativos", "Planejado"),
    ("Testes integrados, documentação e apresentação", "Fase final"),
]
while len(schedule_table.rows) > len(schedule) + 1:
    schedule_table._tbl.remove(schedule_table.rows[-1]._tr)
while len(schedule_table.rows) < len(schedule) + 1:
    schedule_table.add_row()
for row_index, (milestone, state) in enumerate(schedule, start=1):
    set_cell(schedule_table.cell(row_index, 0), milestone)
    set_cell(schedule_table.cell(row_index, 1), state)
for cell in schedule_table.rows[0].cells:
    set_cell(cell, cell.text, bold=True)
    shade_cell(cell, "D9EAF7")
set_paragraph(
    document.paragraphs[306],
    "Observação: os marcos futuros podem ser ajustados de acordo com as entregas definidas pela disciplina e com a validação dos requisitos junto à proprietária da loja.",
)

set_paragraph(document.paragraphs[309], "Referências")
set_paragraph(document.paragraphs[310], "JoStore. Documento de Requisitos do Sistema (DRS_LES_2_2026).")
set_paragraph(document.paragraphs[311], "JoStore. Contrato OpenAPI do módulo de clientes (customer-api.yaml).")
add_reference(document, "Spring. Spring Boot Reference Documentation. Disponível em: https://docs.spring.io/spring-boot/")
add_reference(document, "PostgreSQL Global Development Group. PostgreSQL Documentation. Disponível em: https://www.postgresql.org/docs/")
add_reference(document, "Flyway. Documentation. Disponível em: https://documentation.red-gate.com/flyway")
add_reference(document, "Cypress. Documentation. Disponível em: https://docs.cypress.io/")
add_reference(document, "Object Management Group. Unified Modeling Language (UML). Disponível em: https://www.omg.org/spec/UML/")

document.save(OUTPUT)
print(OUTPUT)
