from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageDraw, ImageFont

source = Path(r"C:\Projetos\JoStore - Projeto\Documento de requisitos\DVP.docx")
output = Path(r"C:\Projetos\JoStore - Projeto\JoStore\.tmp-dvp-edit\dvp-images")
output.mkdir(parents=True, exist_ok=True)

font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 24)
tiles = []
with ZipFile(source) as archive:
    for name in archive.namelist():
        if not name.startswith("word/media/"):
            continue
        try:
            image = Image.open(BytesIO(archive.read(name))).convert("RGB")
        except Exception:
            continue
        image.thumbnail((400, 260))
        tile = Image.new("RGB", (440, 320), "white")
        tile.paste(image, ((440 - image.width) // 2, 35))
        ImageDraw.Draw(tile).text((10, 8), Path(name).name, font=font, fill="black")
        tiles.append(tile)

columns = 3
rows = (len(tiles) + columns - 1) // columns
sheet = Image.new("RGB", (columns * 440, rows * 320), "#e5e7eb")
for index, tile in enumerate(tiles):
    sheet.paste(tile, ((index % columns) * 440, (index // columns) * 320))
sheet.save(output / "contact-sheet.png")
print(output / "contact-sheet.png")
