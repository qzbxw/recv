# Continuation of build_de.py
import re
import subprocess
import json
import sys
import os

# Import the existing translations
from build_de import TRANSLATIONS
from more_translations import MORE_TRANSLATIONS

# Merge them
TRANSLATIONS.update(MORE_TRANSLATIONS)

def ts_to_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip TypeScript annotations
    content = re.sub(r'as const\s*;?', '', content)
    content = re.sub(r'export default \w+\s*;?', '', content)
    
    # Locate the main constant (e.g. const en = ... or const landing = ...)
    # Let's extract the object content. Since we add console.log(JSON.stringify(en)) or console.log(JSON.stringify(landing)), we can find the name of the constant.
    match = re.search(r'const\s+(\w+)\s*=', content)
    if not match:
        raise ValueError(f"Could not find const name in {filepath}")
    const_name = match.group(1)
    
    content += f"\nconsole.log(JSON.stringify({const_name}));"
    
    temp_file = filepath + ".temp.js"
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    try:
        res = subprocess.run(['node', temp_file], capture_output=True, text=True, check=True)
        return json.loads(res.stdout)
    except Exception as e:
        print(f"Error executing {temp_file}: {e}")
        if res:
            print("Stdout:", res.stdout)
            print("Stderr:", res.stderr)
        raise
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

def get_all_strings(val, strings_set):
    if isinstance(val, str):
        strings_set.add(val)
    elif isinstance(val, list):
        for item in val:
            get_all_strings(item, strings_set)
    elif isinstance(val, dict):
        for k, v in val.items():
            get_all_strings(v, strings_set)

def translate_value(val, path=""):
    if isinstance(val, str):
        if val not in TRANSLATIONS:
            # Check if it looks like code, numbers, or URLs that don't need translation
            # (or we can just require everything to be mapped)
            raise KeyError(f"Missing translation for string: {repr(val)} at path {path}")
        return TRANSLATIONS[val]
    elif isinstance(val, list):
        return [translate_value(item, f"{path}[{i}]") for i, item in enumerate(val)]
    elif isinstance(val, dict):
        return {k: translate_value(v, f"{path}.{k}") for k, v in val.items()}
    return val

def format_as_typescript(val, indent=2):
    # Formats Python dictionary as standard TS object literal (recursively)
    # We want to format string, dict, list, boolean, number
    if isinstance(val, str):
        # We need to escape quotes and newlines
        # Replace backslashes first, then quotes and newlines
        escaped = val.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        # Wait, if there are backticks inside code snippets, we can escape them or use double quotes
        return f'"{escaped}"'
    elif isinstance(val, bool):
        return "true" if val else "false"
    elif isinstance(val, (int, float)):
        return str(val)
    elif isinstance(val, list):
        items = [format_as_typescript(item, indent + 2) for item in val]
        sep = ",\n" + " " * (indent + 2)
        return f"[\n" + " " * (indent + 2) + sep.join(items) + f"\n" + " " * indent + "]"
    elif isinstance(val, dict):
        lines = []
        for k, v in val.items():
            # If key has special characters, quote it
            key_str = k
            if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', k):
                key_str = f'"{k}"'
            lines.append(" " * (indent + 2) + f"{key_str}: {format_as_typescript(v, indent + 2)}")
        return "{\n" + ",\n".join(lines) + "\n" + " " * indent + "}"
    return str(val)

def process_file(in_path, out_path):
    print(f"Processing {in_path} -> {out_path}...")
    data = ts_to_json(in_path)
    
    # Translate
    translated_data = translate_value(data)
    
    # Format and write
    ts_content = f"const de = {format_as_typescript(translated_data, 0)} as const;\n\nexport default de;\n"
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print(f"Successfully wrote {out_path}")

if __name__ == '__main__':
    # Find all strings in the files
    strings_set = set()
    files = [
        "frontend-public/src/i18n/en.ts",
        "frontend/src/i18n/en.ts"
    ]
    for fp in files:
        data = ts_to_json(fp)
        get_all_strings(data, strings_set)
        
    missing = sorted([s for s in strings_set if s not in TRANSLATIONS])
    if missing:
        print(f"Found {len(missing)} missing translations:")
        for m in missing:
            print(f"  {repr(m)}")
        sys.exit(1)
        
    # If no missing translations, perform processing
    process_file("frontend-public/src/i18n/en.ts", "frontend-public/src/i18n/de.ts")
    process_file("frontend/src/i18n/en.ts", "frontend/src/i18n/de.ts")
    print("Done!")
