import os
import sys

# Try to import Pillow. If not found, instruct user to install it.
try:
    from PIL import Image
except ImportError:
    print("Pillow library is not installed.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

def clear_metadata_from_image(file_path):
    """
    Opens an image, strips only identifiable metadata (GPS, Camera Model, Time, etc.),
    while preserving useful info (Orientation, Color Profiles, etc.) and integrity.
    Saves it back to the original path.
    """
    try:
        original_format = None
        
        # Open file within a context manager
        with Image.open(file_path) as img:
            # Skip animated images
            if getattr(img, 'is_animated', False):
                print(f"Skipping animated image: {file_path}")
                return

            img.load()
            original_format = img.format
            
            # --- Metadata Preservation Logic ---
            
            # 1. ICC Profile (Colors)
            # Preserve color consistency
            icc_profile = img.info.get('icc_profile')

            # 2. EXIF Data (Orientation, Technicals)
            # We fetch the EXIF object and remove only specific sensitive tags.
            exif = img.getexif()
            
            # List of sensitive tags to REMOVE (Decimal IDs)
            # Ref: https://exiv2.org/tags.html
            SENSITIVE_TAGS = {
                270,    # ImageDescription
                271,    # Make
                272,    # Model
                305,    # Software
                306,    # DateTime
                315,    # Artist
                316,    # HostComputer
                33432,  # Copyright
                34853,  # GPSInfo (Location)
                36867,  # DateTimeOriginal
                36868,  # DateTimeDigitized
                36880, 36881, 36882, # OffsetTime variants
                37500,  # MakerNote (Contains proprietary camera info & often serials)
                37510,  # UserComment
                40091, 40092, 40093, 40094, # XPTitle, XPComment, XPAuthor, etc.
                42032,  # CameraOwnerName
                42033,  # BodySerialNumber
                42034,  # LensSpecification
                42035,  # LensMake
                42036,  # LensModel
                42037,  # LensSerialNumber
            }
            
            # Iterate and remove listed tags if they exist
            # Note: We iterate over keys() to avoid modifying dict while iterating
            for tag in list(exif.keys()):
                if tag in SENSITIVE_TAGS:
                    del exif[tag]

            # Create clean copy
            clean_img = img.copy()

        # --- Saving Logic ---

        # Start with empty info to clear non-EXIF metadata (like PNG text chunks with 'Creation Time')
        clean_img.info = {}
        
        # Restore ICC Profile if it existed
        if icc_profile:
            clean_img.info['icc_profile'] = icc_profile
            
        # Determine format
        save_format = original_format
        if not save_format:
            ext = os.path.splitext(file_path)[1].lower()
            if ext in ['.jpg', '.jpeg']: save_format = 'JPEG'
            elif ext == '.png': save_format = 'PNG'
            elif ext == '.webp': save_format = 'WEBP'
            else: save_format = None

        # Arguments for saving
        save_kwargs = {}
        
        # Attach the sanitized EXIF data
        # Note: 'exif' argument expects bytes or Image.Exif object
        save_kwargs['exif'] = exif

        if save_format == 'JPEG':
            save_kwargs['quality'] = 100
            save_kwargs['subsampling'] = 0
            if icc_profile:
                save_kwargs['icc_profile'] = icc_profile
        elif save_format == 'PNG':
            save_kwargs['optimize'] = True
            if icc_profile:
                save_kwargs['icc_profile'] = icc_profile
        elif save_format == 'WEBP':
            save_kwargs['quality'] = 100
            if icc_profile:
                save_kwargs['icc_profile'] = icc_profile

        # Save overwriting the original
        clean_img.save(file_path, format=save_format, **save_kwargs)
        print(f"Sanitized: {file_path}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    # Determine the static folder path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(script_dir, 'static')

    if not os.path.exists(static_dir):
        print(f"Error: Could not find 'static' folder at: {static_dir}")
        return

    # Set of common image extensions to process
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.gif'}

    print(f"Scanning for images in: {static_dir} ...")
    
    count = 0
    # Recursively walk through the static directory
    for root, dirs, files in os.walk(static_dir):
        for file in files:
            # Check file extension
            ext = os.path.splitext(file)[1].lower()
            if ext in valid_extensions:
                file_path = os.path.join(root, file)
                clear_metadata_from_image(file_path)
                count += 1

    print(f"\nOperation complete. Processed {count} images.")

if __name__ == "__main__":
    main()
