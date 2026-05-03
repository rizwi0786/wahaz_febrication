import sys
import math
import subprocess

try:
    from PIL import Image, ImageFilter
except ImportError:
    print("Pillow not installed. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageFilter

def process_image(input_path, output_path):
    print(f"Processing {input_path}")
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    # 1. Background removal
    width, height = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((width - 1, 0)),
        img.getpixel((0, height - 1)),
        img.getpixel((width - 1, height - 1))
    ]
    bg_r = sum(c[0] for c in corners) / 4
    bg_g = sum(c[1] for c in corners) / 4
    bg_b = sum(c[2] for c in corners) / 4
    
    new_data = []
    # Generative AI blacks are rarely standard black, adding a buffer.
    threshold = 50 
    fade = 40
    
    for item in data:
        r, g, b, a = item
        dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
        
        if dist < threshold:
            new_data.append((r, g, b, 0))
        elif dist < threshold + fade:
            alpha = int(255 * ((dist - threshold) / fade))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    
    # 2. Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # 3. Resize and pad to 1024x317
    target_w = 1024
    target_h = 317
    
    img_w, img_h = img.size
    ratio = min(target_w / img_w, target_h / img_h)
    new_w = int(img_w * ratio)
    new_h = int(img_h * ratio)
    
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 4. Create new transparent canvas and paste
    final_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    final_img.paste(img, (offset_x, offset_y))
    
    final_img.save(output_path, "PNG")
    print(f"Saved processed logo to {output_path}")

if __name__ == "__main__":
    input_file = r"c:\Users\shafiullah.quaraishi\.gemini\antigravity\brain\a4823216-991e-404d-9764-2aff4fa89860\minimal_logo_hq_1776525410742.png"
    output_file = r"c:\Users\shafiullah.quaraishi\OneDrive - Rodic Consultants Pvt Ltd\Desktop\Daily work\Wahaz_Febrication_ecommerce\minimal_logo_transparent_1024x317.png"
    process_image(input_file, output_file)
