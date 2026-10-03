from docx import Document
from docx.oxml.ns import qn

source = r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx"
document = Document(source)

print("TABLES", len(document.tables))
for index, table in enumerate(document.tables):
    print("TABLE", index, [[cell.text for cell in row.cells] for row in table.rows])

print("SHAPES", len(document.inline_shapes))
for index, shape in enumerate(document.inline_shapes):
    blip = shape._inline.graphic.graphicData.pic.blipFill.blip
    relationship_id = blip.embed
    part = document.part.related_parts[relationship_id]
    print(index, relationship_id, part.partname, shape.width, shape.height)

print("BODY ORDER")
for index, child in enumerate(document.element.body):
    tag = child.tag.rsplit('}', 1)[-1]
    texts = child.xpath('.//w:t/text()')
    drawings = child.xpath('.//a:blip')
    embeds = [drawing.get(qn('r:embed')) for drawing in drawings]
    if texts or embeds:
        print(index, tag, ' | '.join(texts)[:140], embeds)

print("PARAGRAPH DRAWINGS")
for index, paragraph in enumerate(document.paragraphs):
    embeds = [blip.get(qn('r:embed')) for blip in paragraph._p.xpath('.//a:blip')]
    if embeds:
        print(index, paragraph.text, embeds)
