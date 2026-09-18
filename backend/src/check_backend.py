
import re, os

base = os.getcwd()
# Procura por imports que começam com @config, @core ou @modules
pattern = re.compile(r'from ["\'](@(?:config|core|modules)/[^"\']+)["\']')

alias_roots = {"@config": "config", "@core": "core", "@modules": "modules"}

missing = []
for root, dirs, files in os.walk(base):
    if "node_modules" in root: continue
    for fn in files:
        if fn.endswith(".ts"):
            path = os.path.join(root, fn)
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()
                for m in pattern.finditer(content):
                    full = m.group(1)
                    prefix, rest = full.split("/", 1)
                    real_root = alias_roots[prefix]
                    
                    # Converte caminhos para o padrão Windows
                    rel_os = rest.replace('/', os.sep)
                    
                    candidates = [
                        os.path.join(base, real_root, rel_os + ".ts"),
                        os.path.join(base, real_root, rel_os, "index.ts"),
                    ]
                    
                    if not any(os.path.isfile(c) for c in candidates):
                        rel_file_path = os.path.relpath(path, base)
                        missing.append((rel_file_path, full))
            except: continue

if missing:
    print("IMPORTS QUEBRADOS NO BACKEND:")
    for path, full in missing:
        print(f"  {path} -> {full}")
else:
    print("OK: Todos os imports @config, @core e @modules estao corretos.")
