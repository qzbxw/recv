import re
import subprocess
import json
import sys

def ts_to_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'as const\s*;?', '', content)
    content = re.sub(r'export default \w+\s*;?', '', content)
    content += "\nconsole.log(JSON.stringify(en));"
    temp_file = filepath + ".temp.js"
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(content)
    try:
        res = subprocess.run(['node', temp_file], capture_output=True, text=True, check=True)
        return json.loads(res.stdout)
    finally:
        import os
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

if __name__ == '__main__':
    strings_set = set()
    for fp in sys.argv[1:]:
        data = ts_to_json(fp)
        get_all_strings(data, strings_set)
    
    # Sort and print
    sorted_strings = sorted(list(strings_set))
    for s in sorted_strings:
        print(s)
