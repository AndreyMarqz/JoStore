from docx import Document

paths = [
    r"C:\Projetos\JoStore - Projeto\Documento de requisitos\Guia_Elaboracao_DVP.docx",
    r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx",
]

for path in paths:
    document = Document(path)
    print(f"\n### {path} paragraphs={len(document.paragraphs)} tables={len(document.tables)} images={len(list(document.inline_shapes))}")
    for index, paragraph in enumerate(document.paragraphs):
        if paragraph.text.strip():
            print(f"{index:03d} | {paragraph.style.name} | {paragraph.text}")
    for index, table in enumerate(document.tables):
        print("TABLE", index, [[cell.text for cell in row.cells] for row in table.rows])
