import sys
import math
from PIL import Image

def process_logo(input_path):
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
        
    return img

def composite_banner(bg_path, logo_path, output_path):
    print(f"Processing background: {bg_path}")
    bg = Image.open(bg_path).convert("RGBA")
    
    # Crop bg to 2.86 : 1 aspect ratio without resizing
    target_aspect = 2.86
    bg_w, bg_h = bg.size
    current_aspect = bg_w / bg_h
    
    if current_aspect > target_aspect:
        # Too wide, crop width
        new_w = int(bg_h * target_aspect)
        left = (bg_w - new_w) / 2
        bg = bg.crop((left, 0, left + new_w, bg_h))
    else:
        # Too tall, crop height
        new_h = int(bg_w / target_aspect)
        top = (bg_h - new_h) / 2
        bg = bg.crop((0, top, bg_w, top + new_h))
        
    bg_w, bg_h = bg.size
    
    print(f"Processing logo: {logo_path}")
    logo = process_logo(logo_path)
    
    # Resize logo to 35% of banner width
    target_logo_w = int(bg_w * 0.35)
    ratio = target_logo_w / logo.width
    new_logo_h = int(logo.height * ratio)
    logo = logo.resize((target_logo_w, new_logo_h), Image.Resampling.LANCZOS)
    
    # Paste logo at upper center
    paste_x = (bg_w - logo.width) // 2
    paste_y = int(bg_h * 0.1) # 10% from the top
    
    bg.alpha_composite(logo, (paste_x, paste_y))
    
    bg.convert("RGB").save(output_path, "PNG")
    print(f"Saved composed banner to {output_path}")

if __name__ == "__main__":
    bg_file = r"c:\Users\shafiullah.quaraishi\.gemini\antigravity\brain\a4823216-991e-404d-9764-2aff4fa89860\tailor_shop_base_1776529521893.png"
    logo_file = r"c:\Users\shafiullah.quaraishi\.gemini\antigravity\brain\a4823216-991e-404d-9764-2aff4fa89860\header_logo_hq_1776525374625.png"
    out_file = r"c:\Users\shafiullah.quaraishi\OneDrive - Rodic Consultants Pvt Ltd\Desktop\Daily work\Wahaz_Febrication_ecommerce\launch_banner_composite.png"
    composite_banner(bg_file, logo_file, out_file)
