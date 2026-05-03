import sys
from PIL import Image

def resize_and_crop(input_path, output_path, target_w, target_h):
    print(f"Processing {input_path}")
    img = Image.open(input_path).convert("RGB")
    
    img_w, img_h = img.size
    
    # Calculate ratio to fill the target box completely
    ratio_w = target_w / img_w
    ratio_h = target_h / img_h
    ratio = max(ratio_w, ratio_h) # Use max to ensure no blank spaces
    
    new_w = int(img_w * ratio)
    new_h = int(img_h * ratio)
    
    # Resize with high quality Lanczos filter
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center Crop
    left = (new_w - target_w) / 2
    top = (new_h - target_h) / 2
    right = (new_w + target_w) / 2
    bottom = (new_h + target_h) / 2
    
    img = img.crop((left, top, right, bottom))
    
    img.save(output_path, "PNG")
    print(f"Saved banner to {output_path}")

if __name__ == "__main__":
    input_file = r"c:\Users\shafiullah.quaraishi\.gemini\antigravity\brain\a4823216-991e-404d-9764-2aff4fa89860\launch_banner_raw_v2_1776529143034.png"
    output_file = r"c:\Users\shafiullah.quaraishi\OneDrive - Rodic Consultants Pvt Ltd\Desktop\Daily work\Wahaz_Febrication_ecommerce\launch_banner_1900x657.png"
    resize_and_crop(input_file, output_file, 1900, 657)
