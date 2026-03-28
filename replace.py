import os
import glob

replacements = {
    "DHD Express": "Maystro Delivery",
    "https://platform.dhd-dz.com/suivi/": "https://maystro-delivery.com/trackingSD.html"
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for filepath in glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.json', recursive=True):
    replace_in_file(filepath)
