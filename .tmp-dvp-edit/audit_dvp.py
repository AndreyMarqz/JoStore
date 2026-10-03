from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

source = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx")
terms = ["XXX", "XXXX", "SISCAD", "ImoX", "Struts", "UMC", "Controle do comércio exterior", "Figrua", "Descrever demais", "[REF"]
namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

with ZipFile(source) as archive:
    for name in archive.namelist():
        if not (name.startswith("word/") and name.endswith(".xml")):
            continue
        try:
            root = ET.fromstring(archive.read(name))
        except ET.ParseError:
            continue
        text = " ".join(root.itertext())
        matches = [term for term in terms if term.lower() in text.lower()]
        if matches:
            print(name, matches)
    print("comments", [name for name in archive.namelist() if "comments" in name])
