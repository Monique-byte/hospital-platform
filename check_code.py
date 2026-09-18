import re, os

def check_balance(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    counts = {}
    for open_c, close_c in [("{", "}"), ("(", ")"), ("[", "]")]:
        counts[open_c] = content.count(open_c)
        counts[close_c] = content.count(close_c)
    problems = []
    if counts["{"] != counts["}"]:
        problems.append(f"{{}} mismatch: {{={counts['{']} }}={counts['}']}")
    if counts["("] != counts[")"]:
        problems.append(f"() mismatch: (={counts['(']} )={counts[')']}")
    if counts["["] != counts["]"]:
        problems.append(f"[] mismatch: [={counts['[']} ]={counts[']']}")
    return problems

all_files = []
# Ajustado para começar da pasta atual do seu Windows
for root, dirs, files in os.walk("."):
    if "node_modules" in root or "dist" in root: continue
    for fn in files:
        if fn.endswith((".ts", ".tsx")):
            all_files.append(os.path.join(root, fn))

issues_found = False
for path in sorted(all_files):
    try:
        problems = check_balance(path)
        if problems:
            issues_found = True
            print(f"ERRO: {path} -> {problems}")
    except:
        continue

print(f"\nTotal arquivos verificados: {len(all_files)}")
if not issues_found:
    print("Sucesso: Nenhum desbalanceamento de chaves/parênteses detectado.")
