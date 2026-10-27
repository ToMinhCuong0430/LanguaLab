def lum(hex_str):
    hex_str = hex_str.lstrip('#')
    r, g, b = [int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def adj(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * adj(r) + 0.7152 * adj(g) + 0.0722 * adj(b)

def contrast(c1, c2):
    l1, l2 = lum(c1), lum(c2)
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

items = [
    ('Focus #D9381E vs Light BG #F5F6FA', '#D9381E', '#F5F6FA', 3.0),
    ('Focus #D9381E vs Light Surface #FFFFFF', '#D9381E', '#FFFFFF', 3.0),
    ('Focus #FFD23F vs Dark BG #12131D', '#FFD23F', '#12131D', 3.0),
    ('Danger #FF5A4E vs Danger-ink #11141D', '#FF5A4E', '#11141D', 4.5),
    ('Secondary #9B6BFF vs Secondary-ink #11141D', '#9B6BFF', '#11141D', 4.5),
    ('Dark Primary #547BFF vs Dark Primary-ink #11141D', '#547BFF', '#11141D', 4.5),
    ('c-blue #2F5BFF vs White #FFFFFF', '#2F5BFF', '#FFFFFF', 4.5),
    ('c-green #00D084 vs Ink #11141D', '#00D084', '#11141D', 4.5),
    ('c-orange #FF8A3D vs Ink #11141D', '#FF8A3D', '#11141D', 4.5),
    ('c-pink #FF70A6 vs Ink #11141D', '#FF70A6', '#11141D', 4.5),
    ('c-yellow #FFD23F vs Ink #11141D', '#FFD23F', '#11141D', 4.5),
    ('c-violet #9B6BFF vs Ink #11141D', '#9B6BFF', '#11141D', 4.5),
    ('c-coral #FF5A4E vs Ink #11141D', '#FF5A4E', '#11141D', 4.5),
    ('c-cyan #23D5E8 vs Ink #11141D', '#23D5E8', '#11141D', 4.5),
]

print(f"{'Pair':<50} | {'Ratio':<8} | {'Target':<6} | {'Pass?':<5}")
print("-" * 75)
for label, c1, c2, target in items:
    val = contrast(c1, c2)
    ok = 'PASS' if val >= target else 'FAIL'
    print(f"{label:<50} | {val:.2f}:1  | >={target:<4} | {ok}")
