from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import shutil
import sys


source = Path(sys.argv[1])
backup = source.with_suffix(".before_toc.docx")
temporary = source.with_suffix(".toc_work.docx")

if not backup.exists():
    shutil.copy2(source, backup)

with ZipFile(source, "r") as original, ZipFile(temporary, "w", ZIP_DEFLATED) as updated:
    for entry in original.infolist():
        data = original.read(entry.filename)
        if entry.filename == "word/settings.xml":
            data = data.replace(b"<w:readOnlyRecommended/>", b"")
            data = data.replace(b"<w:readOnlyRecommended />", b"")
            # Word stores the same recommendation in newer files as writeProtection.
            import re
            data = re.sub(rb"<w:writeProtection\b[^>]*/>", b"", data)
        updated.writestr(entry, data)

temporary.replace(source)
print("Recomendacao de somente leitura removida.")
