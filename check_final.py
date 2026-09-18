import re, os

def strip_comments(content):
    # remove block comments
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
    # remove line comments
    content = re.sub(r"//[^\n]*", "", content)
    return content

def check_balance(path):
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
        content = strip_comments(content)
        counts = {}
        for open_c, close_c in [("{", "}"), ("(", ")"), ("[", "]")]:
            counts[open_c] = content.count(open_c)
            counts[close_c] = content.count(close_c)
        problems = []
        if counts["{"] != counts["}"]:
            problems.append(f"{{}} mismatch: open={counts['{']} close={counts['}']}")
        if counts["("] != counts[")"]:
            problems.append(f"() mismatch: open={counts['(']} close={counts[')']}")
        if counts["["] != counts["]"]:
            problems.append(f"[] mismatch: open={counts['[']} close={counts[']']}")
        return problems
    except:
        return []

all_files = []
for root, dirs, files in os.walk("."):
    if "node_modules" in root or "dist" in root: continue
    for fn in files:
        if fn.endswith((".ts", ".tsx")):
            all_files.append(os.path.join(root, fn))

issues_found = False
for path in sorted(all_files):
    problems = check_balance(path)
    if problems:
        issues_found = True
        print(f"ERRO: {path} -> {problems}")

print(f"\nTotal arquivos verificados: {len(all_files)}")
if not issues_found:
    print("OK: nenhum desbalanceamento real de chaves/parênteses/colchetes.")
