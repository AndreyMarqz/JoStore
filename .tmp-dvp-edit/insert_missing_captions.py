from pathlib import Path

from docx import Document
from docx.text.paragraph import Paragraph
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


source = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx")
document = Document(source)


def drawing_paragraph(relationship_id):
    for paragraph in document.paragraphs:
        ids = [blip.get(qn("r:embed")) for blip in paragraph._p.xpath(".//a:blip")]
        if relationship_id in ids:
            return paragraph
    raise ValueError(relationship_id)


def insert_after(paragraph, text):
    new_element = OxmlElement("w:p")
    paragraph._p.addnext(new_element)
    new_paragraph = Paragraph(new_element, paragraph._parent)
    new_paragraph.style = paragraph.style
    new_paragraph.alignment = 1
    new_paragraph.add_run(text)


insert_after(drawing_paragraph("rId21"), "Figura 3 - Organização lógica em camadas")
insert_after(drawing_paragraph("rId22"), "Figura 4 - Tecnologias associadas às camadas da JoStore")
document.save(source)
