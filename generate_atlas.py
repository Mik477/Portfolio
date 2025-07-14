# generate_atlas.py

import os
import math
from PIL import Image, ImageDraw, ImageFont

# --- CONFIGURATION ---

# The final, definitive list of symbols to be rendered in the atlas.
# This list contains 47 symbols, matching the component's SYMBOL_COUNT.
SYMBOLS = [
    '日', '〇', 'ハ', 'ミ', 'ヒ', 'ウ', 'シ', 'ナ', 'モ', 'サ', 'ワ', 'ツ', 'オ', 'リ', 'ア', 'ホ', 'テ', 'マ',
    'ケ', 'メ', 'エ', 'カ', 'キ', 'ム', 'ユ', 'ラ', 'セ', 'ネ', 'ヲ', 'イ', 'ソ', 'タ', 'チ', 'ト', 'ノ', 'フ',
    'ヘ', 'ヤ', 'ヨ', 'ル', 'レ', 'ロ', '∆', 'δ', 'ε', 'ζ', 'η'
]

# Grid layout and styling
COLS = 8
CELL_SIZE = 64
FONT_SIZE = 52
FONT_COLOR = "#00FF00"
BACKGROUND_COLOR = (0, 0, 0, 0)

# --- FIX: Point directly to the correct, comprehensive Japanese font ---
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
# Noto Sans JP is specifically designed to contain Japanese glyphs.
FONT_PATH = os.path.join(PROJECT_ROOT, 'static', 'fonts', 'NotoSansJP-Regular.ttf')
# --- END FIX ---

# Output configuration
OUTPUT_FILENAME = "matrix-symbols-atlas.png"
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'static', 'images', 'effects')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)


# --- SCRIPT LOGIC ---

def get_font():
    """Loads the specified font from the project's font directory."""
    if not os.path.exists(FONT_PATH):
        print(f"[ERROR] Font not found at the expected path: {FONT_PATH}")
        print("Please ensure 'NotoSansJP-Regular.otf' is located in the '/static/fonts/' directory.")
        return None
    try:
        print(f"-> Loading font: {FONT_PATH}")
        return ImageFont.truetype(FONT_PATH, FONT_SIZE)
    except IOError as e:
        print(f"[ERROR] Could not load the font file. It might be corrupted. Error: {e}")
        return None

def create_atlas():
    """Generates and saves the symbol texture atlas."""
    print("--- Starting Texture Atlas Generation ---")
    
    # 1. Load the font
    font = get_font()
    if font is None:
        return

    # 2. Calculate image dimensions
    num_symbols = len(SYMBOLS)
    rows = math.ceil(num_symbols / COLS)
    img_width = COLS * CELL_SIZE
    img_height = rows * CELL_SIZE

    # 3. Create a new transparent image
    image = Image.new("RGBA", (img_width, img_height), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(image)

    # 4. Draw each symbol onto the grid
    print(f"-> Drawing {num_symbols} symbols onto a {COLS}x{rows} grid ({img_width}x{img_height}px)...")
    for i, symbol in enumerate(SYMBOLS):
        col = i % COLS
        row = i // COLS
        cell_center_x = (col * CELL_SIZE) + (CELL_SIZE / 2)
        cell_center_y = (row * CELL_SIZE) + (CELL_SIZE / 2)
        draw.text(
            (cell_center_x, cell_center_y),
            text=symbol,
            font=font,
            fill=FONT_COLOR,
            anchor="mm"
        )

    # 5. Create the output directory if it doesn't exist
    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
    except OSError as e:
        print(f"[ERROR] Could not create directory '{OUTPUT_DIR}'. Check permissions. Error: {e}")
        return

    # 6. Save the final image
    try:
        image.save(OUTPUT_PATH)
        print("\n-------------------------------------------------")
        print(f"✅ Success! Atlas saved to: {os.path.relpath(OUTPUT_PATH, PROJECT_ROOT)}")
        print("-------------------------------------------------")
    except Exception as e:
        print(f"[ERROR] Could not save the image. Check file permissions. Error: {e}")

if __name__ == "__main__":
    create_atlas()