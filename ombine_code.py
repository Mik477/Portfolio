import os
from pathlib import Path

# --- Configuration ---
SRC_DIRECTORY = Path("src")  # Path to your source directory
OUTPUT_FILENAME = "all_project_code.txt" # Name of the output text file
ALLOWED_EXTENSIONS = {
    ".svelte",
    ".ts",
    ".js",
    ".css",
    ".html",
    ".json",
    ".md",
    # Add any other text-based file extensions you want to include
}
EXCLUDED_DIRS = {
    "node_modules",
    ".svelte-kit",
    "build",
    ".git",
    # Add other directories you want to exclude
}
EXCLUDED_FILES = {
    # Add specific filenames you want to exclude, e.g., "package-lock.json"
}
# --- End Configuration ---

def create_combined_code_file():
    """
    Walks through the SRC_DIRECTORY, reads content from allowed file types,
    and writes it to OUTPUT_FILENAME with clear separators.
    """
    if not SRC_DIRECTORY.is_dir():
        print(f"Error: Source directory '{SRC_DIRECTORY}' not found.")
        print("Please make sure this script is in your project's root directory, or adjust SRC_DIRECTORY.")
        return

    file_count = 0
    try:
        with open(OUTPUT_FILENAME, "w", encoding="utf-8") as outfile:
            print(f"Starting to process files in '{SRC_DIRECTORY}'...")

            for root, dirs, files in os.walk(SRC_DIRECTORY, topdown=True):
                # Modify dirs in-place to exclude specified directories
                dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

                current_path = Path(root)
                for filename in files:
                    if filename in EXCLUDED_FILES:
                        continue

                    filepath = current_path / filename
                    if filepath.suffix.lower() in ALLOWED_EXTENSIONS:
                        relative_path = filepath.relative_to(SRC_DIRECTORY.parent) # Get path relative to project root
                        separator_start = f"--- START OF FILE {relative_path} ---\n"
                        separator_end = f"\n--- END OF FILE {relative_path} ---\n\n"

                        outfile.write(separator_start)
                        try:
                            with open(filepath, "r", encoding="utf-8") as infile:
                                outfile.write(infile.read())
                            print(f"  Added: {relative_path}")
                            file_count += 1
                        except Exception as e:
                            error_message = f"!!! ERROR READING FILE {relative_path}: {e} !!!\n"
                            outfile.write(error_message)
                            print(f"  Error reading {relative_path}: {e}")
                        outfile.write(separator_end)

        print(f"\nSuccessfully created '{OUTPUT_FILENAME}' with content from {file_count} files.")

    except IOError as e:
        print(f"Error writing to output file '{OUTPUT_FILENAME}': {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    create_combined_code_file()