"""Create an unsigned W3C widget; Tizen Studio supplies device signatures."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
manifest = ET.parse(dist / 'config.xml').getroot()
assert manifest.find('{http://www.w3.org/ns/widgets}content').attrib['src'] == 'index.html'
output = dist / 'orbit-chess-unsigned.wgt'
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(dist.rglob('*')):
        if file.is_file() and file.suffix != '.wgt':
            archive.write(file, file.relative_to(dist).as_posix())
print(f'Unsigned widget: {output.stat().st_size / 1024:.0f} KiB')
