import re
import subprocess
import json
import sys

def ts_to_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip TypeScript annotations
    content = re.sub(r'as const\s*;?', '', content)
    content = re.sub(r'export default \w+\s*;?', '', content)
    
    # Add console.log to output the JSON
    # e.g., const en = { ... } -> const en = { ... }; console.log(JSON.stringify(en));
    content += "\nconsole.log(JSON.stringify(en));"
    
    # Write to a temp js file
    temp_file = filepath + ".temp.js"
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    try:
        # Run node to get the JSON representation
        res = subprocess.run(['node', temp_file], capture_output=True, text=True, check=True)
        return json.loads(res.stdout)
    finally:
        import os
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == '__main__':
    data = ts_to_json(sys.argv[1])
    print(json.dumps(list(data.keys())))
