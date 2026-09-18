import re, os

# Define a base como a pasta src onde o script será executado
base = os.getcwd()
pattern = re.compile(r'from ["\'](@/[^"\']+)["\']')

missing = []
for root, dirs, files in os.walk(base):
    if "node_modules" in root: continue
    for fn in files:
        if fn.endswith((".ts", ".tsx")):
            path = os.path.join(root, fn)
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()
                for m in pattern.finditer(content):
                    alias_path = m.group(1)[2:]  # Remove o "@/"
                    # Converte para o padrão de caminho do Windows se necessário
                    alias_path_os = alias_path.replace('/', os.sep)
                    
                    candidates = [
                        os.path.join(base, alias_path_os + ".ts"),
                        os.path.join(base, alias_path_os + ".tsx"),
                        os.path.join(base, alias_path_os, "index.ts"),
                        os.path.join(base, alias_path_os, "index.tsx"),
                    ]
                    
                    if not any(os.path.isfile(c) for c in candidates):
                        rel_path = os.path.relpath(path, base)
                        missing.append((rel_path, alias_path))
            except:
                continue

if missing:
    print("IMPORTS QUEBRADOS (Arquivos não encontrados):")
    for path, alias_path in missing:
        print(f"  {path} -> @/{alias_path}")
else:
    print("OK: Todos os imports com alias @/ resolvem para arquivos existentes.")
