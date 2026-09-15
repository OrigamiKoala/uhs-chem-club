"""
molecules.py — Molecular structures and coordinate geometries for density generation
"""

MOLECULES = {
    "h2": """
    H  0.0  0.0 -0.37
    H  0.0  0.0  0.37
    """,
    
    "lih": """
    Li 0.0  0.0 -0.80
    H  0.0  0.0  0.80
    """,
    
    "hf": """
    F  0.0  0.0 -0.46
    H  0.0  0.0  0.46
    """,
    
    "h2o": """
    O  0.0000  0.0000  0.1173
    H  0.0000  0.7572 -0.4692
    H  0.0000 -0.7572 -0.4692
    """,
    
    "nu_sub_pair": """
    O -2.2  0.4  0.0
    H -2.8  0.0  0.0
    C  0.6  0.0  0.0
    Cl 2.1  0.0  0.0
    H  0.4  0.9  0.4
    H  0.4 -0.9  0.4
    H  0.4  0.0 -0.95
    """
}

if __name__ == "__main__":
    for name, geom in MOLECULES.items():
        print(f"Loaded {name}: {len(geom.strip().splitlines())} atoms")
